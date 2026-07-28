"""BE4a: persistence + presentation-token layer for live opportunities (BEplan §9 BE4.1).

Persistence only. No selection science, no adapter calls, no BKT/hints/scoring — those are
BE4b+ (see ``Dev/Component_B_BE4_Sequencing_Plan.md``). This module never imports
``component_b_generator``; the boundary guard in ``tests/test_be3_live_engine_boundary.py``
stays green. No select/attempt/hint/complete endpoint is wired here — callers (tests, and later
BE4b's orchestration service) drive this directly.

The one-open-opportunity-per-session invariant is enforced at the DB level (partial unique
index on ``b_item_opportunities``, BE4a migration); this service surfaces the resulting
``IntegrityError`` as the same ``ConflictError`` the rest of BE2-BE4 API uses.

Presentation tokens are opaque (``secrets.token_urlsafe``) with only their SHA-256 hash
persisted, following the ``classroom_invites.token_hash`` convention. Validation fails closed on
any mismatch (session/opportunity/learner) or expiry.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Mapping, Sequence
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError
from app.domain.b_opportunity import (
    PresentationTokenExpiredError,
    PresentationTokenMismatchError,
    PresentationTokenNotFoundError,
)
from app.infrastructure.persistence_models import (
    ItemOpportunityRecord,
    PresentationTokenRecord,
    TaskInstanceRecord,
)
from app.infrastructure.repositories import (
    ItemOpportunityRepository,
    PresentationTokenRepository,
    TaskInstanceRepository,
)


PRESENTATION_TOKEN_ENTROPY_BYTES = 32


def _safe_presented_choices(correct_answer: str, distractor_candidates: Sequence[str]) -> list[str]:
    """Mirrors ``project_to_public``'s presented-choices derivation exactly (BE3c)."""
    if not distractor_candidates:
        return []
    return sorted({correct_answer, *distractor_candidates})


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


class OpportunityPersistenceService:
    """Thin repository-backed service: create/read/close opportunities and task instances,
    and issue/validate opaque presentation tokens. No scientific behavior of its own."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._opportunities = ItemOpportunityRepository(session)
        self._task_instances = TaskInstanceRepository(session)
        self._tokens = PresentationTokenRepository(session)

    async def open_opportunity(
        self,
        *,
        session_id: UUID,
        learner_id: UUID,
        skill_id: str,
        item_template_id: str,
        opportunity_index: int,
        selection_provenance: Mapping[str, object],
        timeout: timedelta,
        provenance: Mapping[str, object],
    ) -> ItemOpportunityRecord:
        now = datetime.now(UTC)
        record = ItemOpportunityRecord(
            item_opportunity_id=uuid4(),
            session_id=session_id,
            learner_id=learner_id,
            skill_id=skill_id,
            item_template_id=item_template_id,
            opportunity_index=opportunity_index,
            state="OPEN",
            presented_at_utc=now,
            timeout_deadline_utc=now + timeout,
            selection_provenance=dict(selection_provenance),
            row_version=0,
            **provenance,
        )
        self._session.add(record)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            raise ConflictError() from exc
        return record

    async def close_opportunity(self, item_opportunity_id: UUID) -> ItemOpportunityRecord:
        record = await self._session.scalar(
            select(ItemOpportunityRecord)
            .where(ItemOpportunityRecord.item_opportunity_id == item_opportunity_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if record is None or record.state != "OPEN":
            raise ConflictError()
        record.state = "CLOSED"
        record.row_version += 1
        await self._session.flush()
        return record

    async def create_task_instance(
        self,
        *,
        item_opportunity_id: UUID,
        item_template_id: str,
        skill_id: str,
        grade: int,
        difficulty_level: str,
        representation_type: str,
        response_format: str,
        prompt: Mapping[str, object],
        correct_answer: str,
        allowed_equivalent_answers: Sequence[str],
        distractor_candidates: Sequence[str],
        distractor_rule_ids: Sequence[str],
        generated_operands: Mapping[str, object],
        generation_seed: int,
        applied_guard_ids: Sequence[str],
        catalogue_version: str,
        catalogue_checksum: str,
        provenance: Mapping[str, object],
    ) -> TaskInstanceRecord:
        record = TaskInstanceRecord(
            task_instance_id=uuid4(),
            item_opportunity_id=item_opportunity_id,
            item_template_id=item_template_id,
            skill_id=skill_id,
            grade=grade,
            difficulty_level=difficulty_level,
            representation_type=representation_type,
            response_format=response_format,
            prompt=dict(prompt),
            presented_choices=_safe_presented_choices(correct_answer, distractor_candidates),
            correct_answer=correct_answer,
            allowed_equivalent_answers=list(allowed_equivalent_answers),
            distractor_candidates=list(distractor_candidates),
            distractor_rule_ids=list(distractor_rule_ids),
            generated_operands=dict(generated_operands),
            generation_seed=generation_seed,
            applied_guard_ids=list(applied_guard_ids),
            catalogue_version=catalogue_version,
            catalogue_checksum=catalogue_checksum,
            **provenance,
        )
        self._session.add(record)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            raise ConflictError() from exc
        return record

    async def issue_presentation_token(
        self,
        *,
        session_id: UUID,
        item_opportunity_id: UUID,
        learner_id: UUID,
        runtime_bundle_record_id: UUID,
        ttl: timedelta,
        provenance: Mapping[str, object],
    ) -> tuple[str, PresentationTokenRecord]:
        raw_token = secrets.token_urlsafe(PRESENTATION_TOKEN_ENTROPY_BYTES)
        now = datetime.now(UTC)
        record = PresentationTokenRecord(
            presentation_token_id=uuid4(),
            token_hash=_hash_token(raw_token),
            session_id=session_id,
            item_opportunity_id=item_opportunity_id,
            learner_id=learner_id,
            runtime_bundle_record_id=runtime_bundle_record_id,
            issued_at_utc=now,
            expires_at_utc=now + ttl,
            **provenance,
        )
        self._session.add(record)
        await self._session.flush()
        return raw_token, record

    async def validate_presentation_token(
        self,
        raw_token: str,
        *,
        session_id: UUID,
        item_opportunity_id: UUID,
        learner_id: UUID,
    ) -> PresentationTokenRecord:
        """Fail closed: unknown, mismatched, and expired tokens each raise a distinct,
        never-answer-revealing ``PresentationTokenError``."""
        record = await self._tokens.find_by_token_hash(_hash_token(raw_token))
        if record is None:
            raise PresentationTokenNotFoundError()
        if (
            record.session_id != session_id
            or record.item_opportunity_id != item_opportunity_id
            or record.learner_id != learner_id
        ):
            raise PresentationTokenMismatchError()
        if datetime.now(UTC) >= record.expires_at_utc:
            raise PresentationTokenExpiredError()
        return record
