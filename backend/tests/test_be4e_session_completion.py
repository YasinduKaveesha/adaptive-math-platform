"""BE4e (BEplan §9 BE4.6) tests: migration cycle, next-or-complete atomicity, reuse-determinism
of session aggregation/Guess-Guard/certification via the adapter, SAFE-standing privacy, no
extra BKT observation on completion, replay/idempotency, and recovery (resumable re-fetch of an
OPEN opportunity; stale-token fail-closed).

Every attempt/BKT step below goes through the real BE4c/BE4b services (``AttemptSubmissionService``
/``OpportunitySelectionService``) rather than hand-inserted rows, so the session-aggregation input
this module builds is the same shape production would produce. Aggregation/Guess-Guard/
certification themselves are asserted only through
``app.infrastructure.live_engine.adapter.LiveEngineAdapter`` — no formula is reimplemented here.
"""

import asyncio
import hashlib
import subprocess
from functools import partial
from uuid import UUID, uuid4

import pytest

pytest.importorskip(
    "component_b_generator",
    reason="upadya-component-b-live-engine is not installed; see backend/requirements.in",
)

from sqlalchemy import inspect, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

import app.application.session_completion as session_completion_module
from app.application.attempt_submission import AttemptSubmissionService
from app.application.opportunity_selection import _ENGINEERING_TEST_BUNDLES, OpportunitySelectionService
from app.application.opportunity_persistence import OpportunityPersistenceService
from app.application.session_completion import SessionCompletionService
from app.core.config import get_settings
from app.core.errors import ConflictError
from app.domain.b_completion import OpportunityAdvanceResponse, SessionStandingResponse
from app.domain.b_opportunity import PresentationTokenNotFoundError
from app.domain.principal import AuthenticatedPrincipal
from app.infrastructure.database import async_database_url
from app.infrastructure.persistence_models import (
    AppUser,
    AppUserLearnerLink,
    ItemOpportunityRecord,
    Learner,
    RuntimeBundleRecord,
    SessionAggregateResultRecord,
    SessionRecord,
    SkillCertificationResultRecord,
    SkillStateTransitionRecord,
    TaskInstanceRecord,
)
from app.infrastructure.unit_of_work import SqlAlchemyUnitOfWork


ENGINEERING_BUNDLE_VERSION = "be3b-test-fixture-1.0"
_MANIFEST_PATH, _CATALOGUE_PATH = _ENGINEERING_TEST_BUNDLES[ENGINEERING_BUNDLE_VERSION]


def alembic(*args: str) -> None:
    subprocess.run(["alembic", *args], check=True)


def isolated_database():
    database_engine = create_async_engine(
        async_database_url(get_settings().database_url),
        poolclass=NullPool,
    )
    factory = async_sessionmaker(database_engine, expire_on_commit=False, class_=AsyncSession)
    return database_engine, factory


def provenance(resource_type: str, resource_id: UUID) -> dict[str, object]:
    return {
        "system_actor": "be4e-isolated-test",
        "request_id": f"test-{uuid4()}",
        "operation_or_event_type": "test.be4e_session_completion",
        "reason_code": "ISOLATED_SYNTHETIC_TEST",
        "resource_type": resource_type,
        "resource_id": resource_id,
        "source_class": "TEST",
        "source_system": "be4e-isolated-test-suite",
        "environment": "test",
        "schema_revision": "20260728_0003",
    }


async def _ensure_engineering_test_bundle(session: AsyncSession) -> UUID:
    existing = await session.scalar(
        select(RuntimeBundleRecord).where(RuntimeBundleRecord.bundle_version == ENGINEERING_BUNDLE_VERSION)
    )
    if existing is not None:
        return existing.runtime_bundle_record_id
    bundle_id = uuid4()
    session.add(
        RuntimeBundleRecord(
            runtime_bundle_record_id=bundle_id,
            bundle_version=ENGINEERING_BUNDLE_VERSION,
            manifest_checksum=hashlib.sha256(b"be4e-engineering-test-bundle-db-stub").hexdigest(),
            publication_state="PUBLISHED",
            approval_status="APPROVED",
            immutable_after_publication=True,
            **provenance("b_runtime_bundle_record", bundle_id),
        )
    )
    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        existing = await session.scalar(
            select(RuntimeBundleRecord).where(RuntimeBundleRecord.bundle_version == ENGINEERING_BUNDLE_VERSION)
        )
        assert existing is not None
        return existing.runtime_bundle_record_id
    return bundle_id


async def _seed_learner_and_session(session: AsyncSession) -> tuple[UUID, UUID, str]:
    bundle_id = await _ensure_engineering_test_bundle(session)

    subject = f"subject-{uuid4()}"
    user_id = uuid4()
    session.add(
        AppUser(
            user_id=user_id, supabase_subject=subject, status="active", profile_type="LEARNER",
            **provenance("app_user", user_id),
        )
    )
    learner_id = uuid4()
    session.add(Learner(learner_id=learner_id, grade=3, status="active", **provenance("b_learner", learner_id)))
    await session.flush()

    session.add(
        AppUserLearnerLink(
            link_id=uuid4(), user_id=user_id, learner_id=learner_id, **provenance("app_user_learner_link", uuid4())
        )
    )

    session_id = uuid4()
    session.add(
        SessionRecord(
            session_id=session_id,
            learner_id=learner_id,
            runtime_bundle_record_id=bundle_id,
            state="active",
            expires_at_utc=None,
            row_version=0,
            **provenance("b_session", session_id),
        )
    )
    await session.flush()
    return session_id, learner_id, subject


def _principal(subject: str) -> AuthenticatedPrincipal:
    return AuthenticatedPrincipal(user_id=subject, email="learner@example.test")


async def _select_opportunity(service: OpportunitySelectionService, *, subject: str, session_id: UUID):
    return await service.select_next_opportunity(_principal(subject), session_id, f"req-{uuid4()}")


async def _submit_correct_first_attempt(
    factory, service: AttemptSubmissionService, *, subject: str, session_id: UUID, item_opportunity_id: UUID
):
    async with factory() as session:
        task_instance = await session.scalar(
            select(TaskInstanceRecord).where(TaskInstanceRecord.item_opportunity_id == item_opportunity_id)
        )
        correct_answer = task_instance.correct_answer

    from app.domain.b_attempt import SubmitResponseRequest

    return await service.submit_response(
        _principal(subject),
        session_id,
        item_opportunity_id,
        f"key-{uuid4()}",
        f"req-{uuid4()}",
        SubmitResponseRequest(submitted_value=correct_answer, client_elapsed_ms=1200),
    )


async def _complete_and_advance(
    service: SessionCompletionService,
    *,
    subject: str,
    session_id: UUID,
    item_opportunity_id: UUID,
    idempotency_key: str | None = None,
) -> OpportunityAdvanceResponse:
    return await service.complete_and_advance(
        _principal(subject), session_id, item_opportunity_id, idempotency_key or f"key-{uuid4()}", f"req-{uuid4()}"
    )


# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------


def test_migration_downgrade_reupgrade_cycle_and_schema() -> None:
    alembic("upgrade", "head")

    async def inspect_schema() -> None:
        database_engine, _ = isolated_database()
        async with database_engine.connect() as connection:
            def assertions(sync_connection) -> None:
                inspector = inspect(sync_connection)
                tables = set(inspector.get_table_names())
                assert {"b_session_aggregate_results", "b_skill_certification_results"} <= tables
                aggregate_uniques = {uc["name"] for uc in inspector.get_unique_constraints("b_session_aggregate_results")}
                assert "uq_b_session_aggregate_results_session" in aggregate_uniques
                certification_uniques = {
                    uc["name"] for uc in inspector.get_unique_constraints("b_skill_certification_results")
                }
                assert "uq_b_skill_certification_results_session_skill" in certification_uniques

            await connection.run_sync(assertions)
        await database_engine.dispose()

    asyncio.run(inspect_schema())

    alembic("downgrade", "20260728_0002")

    async def assert_dropped() -> None:
        database_engine, _ = isolated_database()
        async with database_engine.connect() as connection:
            def assertions(sync_connection) -> None:
                inspector = inspect(sync_connection)
                tables = set(inspector.get_table_names())
                assert not ({"b_session_aggregate_results", "b_skill_certification_results"} & tables)

            await connection.run_sync(assertions)
        await database_engine.dispose()

    asyncio.run(assert_dropped())
    alembic("upgrade", "head")


# ---------------------------------------------------------------------------
# Next-or-complete, atomic
# ---------------------------------------------------------------------------


def test_complete_below_bound_closes_current_and_opens_exactly_one_next_opportunity() -> None:
    alembic("upgrade", "head")

    async def exercise() -> None:
        database_engine, factory = isolated_database()
        async with factory() as session:
            session_id, learner_id, subject = await _seed_learner_and_session(session)
            await session.commit()

        selection_service = OpportunitySelectionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
        attempt_service = AttemptSubmissionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
        completion_service = SessionCompletionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))

        first = await _select_opportunity(selection_service, subject=subject, session_id=session_id)
        first_opportunity_id = UUID(first.item_opportunity_id)
        await _submit_correct_first_attempt(
            factory, attempt_service, subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id
        )

        response = await _complete_and_advance(
            completion_service, subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id
        )
        assert response.session_state == "active"
        assert response.opportunities_completed == 1
        assert response.next_opportunity is not None
        assert UUID(response.next_opportunity.item_opportunity_id) != first_opportunity_id

        async with factory() as session:
            rows = (
                await session.scalars(select(ItemOpportunityRecord).where(ItemOpportunityRecord.session_id == session_id))
            ).all()
            assert len(rows) == 2
            states = {row.item_opportunity_id: row.state for row in rows}
            assert states[first_opportunity_id] == "CLOSED"
            open_rows = [row for row in rows if row.state == "OPEN"]
            assert len(open_rows) == 1

            session_row = await session.get(SessionRecord, session_id)
            assert session_row.state == "active"

        await database_engine.dispose()

    asyncio.run(exercise())


def test_complete_at_bound_completes_session_and_persists_aggregate_and_certification_privately() -> None:
    alembic("upgrade", "head")
    original_bound = session_completion_module.MAX_OPPORTUNITIES_PER_SESSION
    session_completion_module.MAX_OPPORTUNITIES_PER_SESSION = 1
    try:

        async def exercise() -> None:
            database_engine, factory = isolated_database()
            async with factory() as session:
                session_id, learner_id, subject = await _seed_learner_and_session(session)
                await session.commit()

            selection_service = OpportunitySelectionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
            attempt_service = AttemptSubmissionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
            completion_service = SessionCompletionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))

            first = await _select_opportunity(selection_service, subject=subject, session_id=session_id)
            first_opportunity_id = UUID(first.item_opportunity_id)
            attempt = await _submit_correct_first_attempt(
                factory, attempt_service, subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id
            )
            assert attempt.response_matched is True

            async with factory() as session:
                transition = await session.scalar(
                    select(SkillStateTransitionRecord).where(
                        SkillStateTransitionRecord.item_opportunity_id == first_opportunity_id
                    )
                )
                assert transition is not None
                skill_id = transition.skill_id

            response = await _complete_and_advance(
                completion_service, subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id
            )
            assert response.session_state == "completed"
            assert response.next_opportunity is None
            assert response.opportunities_completed == 1
            assert response.opportunities_total_bound == 1

            async with factory() as session:
                session_row = await session.get(SessionRecord, session_id)
                assert session_row.state == "completed"

                aggregate = await session.scalar(
                    select(SessionAggregateResultRecord).where(SessionAggregateResultRecord.session_id == session_id)
                )
                assert aggregate is not None
                assert aggregate.opportunity_count == 1
                assert aggregate.first_attempt_match_rate == 1.0
                assert aggregate.completion_count == 1
                assert aggregate.completion_rate == 1.0
                assert aggregate.total_retry_count == 0
                assert aggregate.completion_policy_version == session_completion_module.COMPLETION_POLICY_VERSION

                certification = await session.scalar(
                    select(SkillCertificationResultRecord).where(
                        SkillCertificationResultRecord.session_id == session_id,
                        SkillCertificationResultRecord.skill_id == skill_id,
                    )
                )
                assert certification is not None
                assert certification.opportunity_count == 1
                assert certification.attempt_count == 1
                assert certification.first_attempt_match_count == 1
                assert certification.skill_estimate is not None
                # Guess-Guard needs >= floor_min_obs (5) valid RTs (the TEST_FIXTURE_ONLY BKT
                # config); a single opportunity's one RT sample is below that, so the frozen
                # 3-valued rule reports INSUFFICIENT_EVIDENCE (never fabricated NOT_TRIGGERED),
                # and certify_skill's frozen rule (both TRIGGERED and INSUFFICIENT_EVIDENCE block)
                # withholds certification.
                assert certification.plausibility_status == "INSUFFICIENT_EVIDENCE"
                assert certification.threshold_met_flag is False

            await database_engine.dispose()

        asyncio.run(exercise())
    finally:
        session_completion_module.MAX_OPPORTUNITIES_PER_SESSION = original_bound


def test_advance_requires_at_least_one_attempt() -> None:
    alembic("upgrade", "head")

    async def exercise() -> None:
        database_engine, factory = isolated_database()
        async with factory() as session:
            session_id, learner_id, subject = await _seed_learner_and_session(session)
            await session.commit()

        selection_service = OpportunitySelectionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
        completion_service = SessionCompletionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))

        first = await _select_opportunity(selection_service, subject=subject, session_id=session_id)
        first_opportunity_id = UUID(first.item_opportunity_id)

        with pytest.raises(ConflictError):
            await _complete_and_advance(
                completion_service, subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id
            )

        await database_engine.dispose()

    asyncio.run(exercise())


def test_completion_creates_no_additional_bkt_transition_or_observation() -> None:
    alembic("upgrade", "head")

    async def exercise() -> None:
        database_engine, factory = isolated_database()
        async with factory() as session:
            session_id, learner_id, subject = await _seed_learner_and_session(session)
            await session.commit()

        selection_service = OpportunitySelectionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
        attempt_service = AttemptSubmissionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
        completion_service = SessionCompletionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))

        first = await _select_opportunity(selection_service, subject=subject, session_id=session_id)
        first_opportunity_id = UUID(first.item_opportunity_id)
        await _submit_correct_first_attempt(
            factory, attempt_service, subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id
        )

        async with factory() as session:
            before_count = len(
                (await session.scalars(select(SkillStateTransitionRecord))).all()
            )

        await _complete_and_advance(
            completion_service, subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id
        )

        async with factory() as session:
            after_count = len(
                (await session.scalars(select(SkillStateTransitionRecord))).all()
            )
        assert after_count == before_count

        await database_engine.dispose()

    asyncio.run(exercise())


# ---------------------------------------------------------------------------
# Replay / idempotency
# ---------------------------------------------------------------------------


def test_replay_with_same_idempotency_key_returns_same_response_without_second_effect() -> None:
    alembic("upgrade", "head")

    async def exercise() -> None:
        database_engine, factory = isolated_database()
        async with factory() as session:
            session_id, learner_id, subject = await _seed_learner_and_session(session)
            await session.commit()

        selection_service = OpportunitySelectionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
        attempt_service = AttemptSubmissionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
        completion_service = SessionCompletionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))

        first = await _select_opportunity(selection_service, subject=subject, session_id=session_id)
        first_opportunity_id = UUID(first.item_opportunity_id)
        await _submit_correct_first_attempt(
            factory, attempt_service, subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id
        )

        key = f"replay-key-{uuid4()}"
        one = await _complete_and_advance(
            completion_service,
            subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id, idempotency_key=key,
        )
        two = await _complete_and_advance(
            completion_service,
            subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id, idempotency_key=key,
        )
        assert one == two

        async with factory() as session:
            rows = (
                await session.scalars(select(ItemOpportunityRecord).where(ItemOpportunityRecord.session_id == session_id))
            ).all()
            assert len(rows) == 2  # replay opened no second "next" opportunity

        await database_engine.dispose()

    asyncio.run(exercise())


# ---------------------------------------------------------------------------
# Recovery: resumable re-fetch of an OPEN opportunity; stale-token fail-closed
# ---------------------------------------------------------------------------


def test_reselecting_with_an_open_opportunity_returns_the_same_opportunity_not_a_duplicate() -> None:
    alembic("upgrade", "head")

    async def exercise() -> None:
        database_engine, factory = isolated_database()
        async with factory() as session:
            session_id, learner_id, subject = await _seed_learner_and_session(session)
            await session.commit()

        selection_service = OpportunitySelectionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))

        first = await _select_opportunity(selection_service, subject=subject, session_id=session_id)
        # Simulate app restart / retried network call: select again with no attempt in between.
        second = await _select_opportunity(selection_service, subject=subject, session_id=session_id)

        assert first.item_opportunity_id == second.item_opportunity_id
        assert first.presentation_token != second.presentation_token  # fresh token, same opportunity

        async with factory() as session:
            rows = (
                await session.scalars(select(ItemOpportunityRecord).where(ItemOpportunityRecord.session_id == session_id))
            ).all()
            assert len(rows) == 1  # no duplicate opportunity was created

        await database_engine.dispose()

    asyncio.run(exercise())


def test_stale_presentation_token_fails_closed_and_clean_reselect_succeeds() -> None:
    alembic("upgrade", "head")

    async def exercise() -> None:
        database_engine, factory = isolated_database()
        async with factory() as session:
            session_id, learner_id, subject = await _seed_learner_and_session(session)
            await session.commit()

        selection_service = OpportunitySelectionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
        first = await _select_opportunity(selection_service, subject=subject, session_id=session_id)
        item_opportunity_id = UUID(first.item_opportunity_id)

        async with factory() as session:
            with pytest.raises(PresentationTokenNotFoundError):
                await OpportunityPersistenceService(session).validate_presentation_token(
                    "not-a-real-token",
                    session_id=session_id,
                    item_opportunity_id=item_opportunity_id,
                    learner_id=learner_id,
                )

        # A stale/unknown token fails closed; a clean re-select still recovers the same,
        # still-OPEN opportunity rather than duplicating it.
        second = await _select_opportunity(selection_service, subject=subject, session_id=session_id)
        assert second.item_opportunity_id == first.item_opportunity_id

        async with factory() as session:
            rows = (
                await session.scalars(select(ItemOpportunityRecord).where(ItemOpportunityRecord.session_id == session_id))
            ).all()
            assert len(rows) == 1

        await database_engine.dispose()

    asyncio.run(exercise())


# ---------------------------------------------------------------------------
# SAFE-progress privacy
# ---------------------------------------------------------------------------

FORBIDDEN_PRIVATE_KEYS = {
    "p_l", "p_l_before", "p_l_after", "predicted_probability", "posterior_p_l",
    "skill_estimate", "certified", "threshold_met_flag", "plausibility_status",
    "correct_answer", "allowed_equivalent_answers", "selection_provenance",
    "theta_b", "guard_status",
}


def test_public_advance_and_standing_responses_contain_no_private_fields() -> None:
    alembic("upgrade", "head")

    async def exercise() -> None:
        database_engine, factory = isolated_database()
        async with factory() as session:
            session_id, learner_id, subject = await _seed_learner_and_session(session)
            await session.commit()

        selection_service = OpportunitySelectionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
        attempt_service = AttemptSubmissionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))
        completion_service = SessionCompletionService(uow_factory=partial(SqlAlchemyUnitOfWork, factory=factory))

        first = await _select_opportunity(selection_service, subject=subject, session_id=session_id)
        first_opportunity_id = UUID(first.item_opportunity_id)
        await _submit_correct_first_attempt(
            factory, attempt_service, subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id
        )
        advance = await _complete_and_advance(
            completion_service, subject=subject, session_id=session_id, item_opportunity_id=first_opportunity_id
        )
        advance_dict = advance.model_dump(mode="json")
        assert not (FORBIDDEN_PRIVATE_KEYS & set(advance_dict))
        assert set(advance_dict) == {
            "item_opportunity_id", "session_state", "opportunities_completed",
            "opportunities_total_bound", "next_opportunity", "request_id",
        }
        if advance_dict["next_opportunity"] is not None:
            assert not (FORBIDDEN_PRIVATE_KEYS & set(advance_dict["next_opportunity"]))

        standing = await completion_service.get_session_standing(_principal(subject), session_id, f"req-{uuid4()}")
        assert isinstance(standing, SessionStandingResponse)
        standing_dict = standing.model_dump(mode="json")
        assert not (FORBIDDEN_PRIVATE_KEYS & set(standing_dict))
        assert set(standing_dict) == {
            "session_id", "session_state", "opportunities_completed", "opportunities_total_bound", "request_id",
        }

        await database_engine.dispose()

    asyncio.run(exercise())
