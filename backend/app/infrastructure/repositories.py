"""SQLAlchemy repositories for the twelve neutral BE2 tables."""

from typing import Generic, Sequence, TypeVar
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence_models import (
    AppUser, AppUserLearnerLink, AttemptRecord, AuditEvent, Base, Classroom, ClassroomInvite,
    ClassroomMembership, HintEventRecord, IdempotencyRecord, ItemOpportunityRecord, Learner,
    LearnerSkillStateRecord, PresentationTokenRecord, RuntimeBundleRecord,
    SessionAggregateResultRecord, SessionEvent, SessionRecord, SkillCertificationResultRecord,
    SkillStateTransitionRecord, TaskInstanceRecord, TeacherProfile,
)


ModelT = TypeVar("ModelT", bound=Base)


class SqlAlchemyNeutralRepository(Generic[ModelT]):
    model_type: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def add(self, record: ModelT) -> None:
        self.session.add(record)
        await self.session.flush()

    async def get_by_id(self, record_id: UUID) -> ModelT | None:
        return await self.session.get(self.model_type, record_id)

    async def exists(self, record_id: UUID) -> bool:
        return await self.get_by_id(record_id) is not None


class AppUserRepository(SqlAlchemyNeutralRepository[AppUser]):
    model_type = AppUser

    async def find_by_subject(self, subject: str) -> AppUser | None:
        return await self.session.scalar(select(AppUser).where(AppUser.supabase_subject == subject))


class LearnerRepository(SqlAlchemyNeutralRepository[Learner]):
    model_type = Learner


class AppUserLearnerLinkRepository(SqlAlchemyNeutralRepository[AppUserLearnerLink]):
    model_type = AppUserLearnerLink

    async def find_by_user(self, user_id: UUID) -> AppUserLearnerLink | None:
        return await self.session.scalar(select(AppUserLearnerLink).where(AppUserLearnerLink.user_id == user_id))


class RuntimeBundleRecordRepository(SqlAlchemyNeutralRepository[RuntimeBundleRecord]):
    model_type = RuntimeBundleRecord

    async def find_current_approved_published(self) -> RuntimeBundleRecord | None:
        """Resolve the bundle to pin a newly started session to.

        Tie-break is the most recently created PUBLISHED+APPROVED bundle. Multiple
        simultaneously eligible bundles are not expected in practice; the exact
        selection policy for that case is an engineering assumption, not a governed
        decision.
        """
        statement = (
            select(RuntimeBundleRecord)
            .where(
                RuntimeBundleRecord.publication_state == "PUBLISHED",
                RuntimeBundleRecord.approval_status == "APPROVED",
            )
            .order_by(RuntimeBundleRecord.created_at_utc.desc(), RuntimeBundleRecord.runtime_bundle_record_id.desc())
            .limit(1)
        )
        return await self.session.scalar(statement)


class SessionRecordRepository(SqlAlchemyNeutralRepository[SessionRecord]):
    model_type = SessionRecord

    async def find_starting_or_active_for_learner(self, learner_id: UUID) -> SessionRecord | None:
        return await self.session.scalar(
            select(SessionRecord).where(
                SessionRecord.learner_id == learner_id,
                SessionRecord.state.in_(("starting", "active")),
            )
        )

    async def find_active_for_learner(self, learner_id: UUID) -> SessionRecord | None:
        return await self.session.scalar(
            select(SessionRecord).where(
                SessionRecord.learner_id == learner_id,
                SessionRecord.state == "active",
            )
        )

    async def get_owned(self, session_id: UUID, learner_id: UUID) -> SessionRecord | None:
        return await self.session.scalar(
            select(SessionRecord).where(
                SessionRecord.session_id == session_id,
                SessionRecord.learner_id == learner_id,
            )
        )


class SessionEventRepository(SqlAlchemyNeutralRepository[SessionEvent]):
    model_type = SessionEvent


class IdempotencyRecordRepository(SqlAlchemyNeutralRepository[IdempotencyRecord]):
    model_type = IdempotencyRecord

    async def find_scoped(
        self,
        actor_user_id: UUID,
        http_method: str,
        operation_identifier: str,
        idempotency_key: str,
    ) -> IdempotencyRecord | None:
        statement: Select[tuple[IdempotencyRecord]] = select(IdempotencyRecord).where(
            IdempotencyRecord.actor_user_id == actor_user_id,
            IdempotencyRecord.http_method == http_method,
            IdempotencyRecord.operation_identifier == operation_identifier,
            IdempotencyRecord.idempotency_key == idempotency_key,
        )
        return await self.session.scalar(statement)


class AuditEventRepository(SqlAlchemyNeutralRepository[AuditEvent]):
    model_type = AuditEvent


class TeacherProfileRepository(SqlAlchemyNeutralRepository[TeacherProfile]):
    model_type = TeacherProfile

    async def find_by_user(self, user_id: UUID) -> TeacherProfile | None:
        return await self.session.scalar(select(TeacherProfile).where(TeacherProfile.user_id == user_id))


class ClassroomRepository(SqlAlchemyNeutralRepository[Classroom]):
    model_type = Classroom

    async def list_owned(self, teacher_profile_id: UUID) -> list[Classroom]:
        result = await self.session.scalars(select(Classroom).where(Classroom.teacher_profile_id == teacher_profile_id).order_by(Classroom.created_at_utc, Classroom.classroom_id))
        return list(result)

    async def get_owned(self, classroom_id: UUID, teacher_profile_id: UUID) -> Classroom | None:
        return await self.session.scalar(select(Classroom).where(Classroom.classroom_id == classroom_id, Classroom.teacher_profile_id == teacher_profile_id))


class ClassroomInviteRepository(SqlAlchemyNeutralRepository[ClassroomInvite]):
    model_type = ClassroomInvite

    async def find_by_token_hash(self, token_hash: str) -> ClassroomInvite | None:
        return await self.session.scalar(select(ClassroomInvite).where(ClassroomInvite.token_hash == token_hash))

    async def get_owned(self, classroom_invite_id: UUID, teacher_profile_id: UUID) -> ClassroomInvite | None:
        statement = (
            select(ClassroomInvite)
            .join(Classroom, Classroom.classroom_id == ClassroomInvite.classroom_id)
            .where(ClassroomInvite.classroom_invite_id == classroom_invite_id, Classroom.teacher_profile_id == teacher_profile_id)
        )
        return await self.session.scalar(statement)


class ClassroomMembershipRepository(SqlAlchemyNeutralRepository[ClassroomMembership]):
    model_type = ClassroomMembership

    async def find_by_classroom_and_learner(self, classroom_id: UUID, learner_id: UUID) -> ClassroomMembership | None:
        return await self.session.scalar(
            select(ClassroomMembership).where(ClassroomMembership.classroom_id == classroom_id, ClassroomMembership.learner_id == learner_id)
        )

    async def get_owned(self, classroom_membership_id: UUID, teacher_profile_id: UUID) -> ClassroomMembership | None:
        statement = (
            select(ClassroomMembership)
            .join(Classroom, Classroom.classroom_id == ClassroomMembership.classroom_id)
            .where(ClassroomMembership.classroom_membership_id == classroom_membership_id, Classroom.teacher_profile_id == teacher_profile_id)
        )
        return await self.session.scalar(statement)

    async def learner_has_other_approved_membership(self, learner_id: UUID, excluding_membership_id: UUID) -> bool:
        existing = await self.session.scalar(
            select(ClassroomMembership.classroom_membership_id).where(
                ClassroomMembership.learner_id == learner_id,
                ClassroomMembership.state == "APPROVED",
                ClassroomMembership.classroom_membership_id != excluding_membership_id,
            )
        )
        return existing is not None

    async def list_for_classroom_with_learner_name(self, classroom_id: UUID) -> list[tuple[ClassroomMembership, str | None]]:
        statement = (
            select(ClassroomMembership, Learner.name)
            .join(Learner, Learner.learner_id == ClassroomMembership.learner_id)
            .where(ClassroomMembership.classroom_id == classroom_id)
            .order_by(ClassroomMembership.requested_at_utc, ClassroomMembership.classroom_membership_id)
        )
        result = await self.session.execute(statement)
        return list(result.all())

    async def list_approved_for_classroom_with_learner_name(self, classroom_id: UUID) -> list[tuple[ClassroomMembership, str | None]]:
        statement = (
            select(ClassroomMembership, Learner.name)
            .join(Learner, Learner.learner_id == ClassroomMembership.learner_id)
            .where(ClassroomMembership.classroom_id == classroom_id, ClassroomMembership.state == "APPROVED")
            .order_by(ClassroomMembership.decided_at_utc, ClassroomMembership.classroom_membership_id)
        )
        result = await self.session.execute(statement)
        return list(result.all())

    async def list_for_learner_with_classroom(self, learner_id: UUID) -> list[tuple[ClassroomMembership, str | None, str]]:
        statement = (
            select(ClassroomMembership, Classroom.name, Classroom.grade)
            .join(Classroom, Classroom.classroom_id == ClassroomMembership.classroom_id)
            .where(ClassroomMembership.learner_id == learner_id)
            .order_by(ClassroomMembership.requested_at_utc, ClassroomMembership.classroom_membership_id)
        )
        result = await self.session.execute(statement)
        return list(result.all())


class ItemOpportunityRepository(SqlAlchemyNeutralRepository[ItemOpportunityRecord]):
    model_type = ItemOpportunityRecord

    async def find_open_for_session(self, session_id: UUID) -> ItemOpportunityRecord | None:
        return await self.session.scalar(
            select(ItemOpportunityRecord).where(
                ItemOpportunityRecord.session_id == session_id,
                ItemOpportunityRecord.state == "OPEN",
            )
        )

    async def get_owned(self, item_opportunity_id: UUID, learner_id: UUID) -> ItemOpportunityRecord | None:
        return await self.session.scalar(
            select(ItemOpportunityRecord).where(
                ItemOpportunityRecord.item_opportunity_id == item_opportunity_id,
                ItemOpportunityRecord.learner_id == learner_id,
            )
        )

    async def count_for_session(self, session_id: UUID) -> int:
        return await self.session.scalar(
            select(func.count()).select_from(ItemOpportunityRecord).where(ItemOpportunityRecord.session_id == session_id)
        )

    async def get_for_update(self, item_opportunity_id: UUID) -> ItemOpportunityRecord | None:
        """Row-locks the opportunity so attempt-index derivation and the OPEN-state check are
        race-free under concurrent submissions (BEplan §9 BE4.3 step 4)."""
        return await self.session.scalar(
            select(ItemOpportunityRecord)
            .where(ItemOpportunityRecord.item_opportunity_id == item_opportunity_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )

    async def count_closed_for_session(self, session_id: UUID) -> int:
        """BE4e (BEplan §9 BE4.6): count of CLOSED-only opportunities — used by the SAFE
        standing view so an in-progress (still-OPEN) opportunity is never counted as
        completed."""
        return await self.session.scalar(
            select(func.count())
            .select_from(ItemOpportunityRecord)
            .where(ItemOpportunityRecord.session_id == session_id, ItemOpportunityRecord.state == "CLOSED")
        )

    async def list_for_session(self, session_id: UUID) -> list[ItemOpportunityRecord]:
        """BE4e (BEplan §9 BE4.6): every opportunity row for a session, ordered deterministically,
        used to build the session-aggregation input set."""
        result = await self.session.scalars(
            select(ItemOpportunityRecord)
            .where(ItemOpportunityRecord.session_id == session_id)
            .order_by(ItemOpportunityRecord.opportunity_index)
        )
        return list(result)


class TaskInstanceRepository(SqlAlchemyNeutralRepository[TaskInstanceRecord]):
    model_type = TaskInstanceRecord

    async def find_by_opportunity(self, item_opportunity_id: UUID) -> TaskInstanceRecord | None:
        return await self.session.scalar(
            select(TaskInstanceRecord).where(TaskInstanceRecord.item_opportunity_id == item_opportunity_id)
        )


class PresentationTokenRepository(SqlAlchemyNeutralRepository[PresentationTokenRecord]):
    model_type = PresentationTokenRecord

    async def find_by_token_hash(self, token_hash: str) -> PresentationTokenRecord | None:
        return await self.session.scalar(
            select(PresentationTokenRecord).where(PresentationTokenRecord.token_hash == token_hash)
        )


class LearnerSkillStateRepository(SqlAlchemyNeutralRepository[LearnerSkillStateRecord]):
    model_type = LearnerSkillStateRecord

    async def list_for_learner(self, learner_id: UUID) -> list[LearnerSkillStateRecord]:
        result = await self.session.scalars(
            select(LearnerSkillStateRecord).where(LearnerSkillStateRecord.learner_id == learner_id)
        )
        return list(result)

    async def get_for_update(self, learner_id: UUID, skill_id: str) -> LearnerSkillStateRecord | None:
        """``populate_existing=True`` is required: BE4b's selection step may already have loaded
        this row into the session identity map earlier in the same request; without it SQLAlchemy
        would keep those stale pre-lock attributes instead of refreshing from this FOR UPDATE
        read (the same identity-map staleness hazard BE4c's spec calls out from the
        approve_membership carry-forward)."""
        return await self.session.scalar(
            select(LearnerSkillStateRecord)
            .where(LearnerSkillStateRecord.learner_id == learner_id, LearnerSkillStateRecord.skill_id == skill_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )


class AttemptRepository(SqlAlchemyNeutralRepository[AttemptRecord]):
    model_type = AttemptRecord

    async def count_for_opportunity(self, item_opportunity_id: UUID) -> int:
        return await self.session.scalar(
            select(func.count()).select_from(AttemptRecord).where(AttemptRecord.item_opportunity_id == item_opportunity_id)
        )

    async def list_for_opportunity(self, item_opportunity_id: UUID) -> list[AttemptRecord]:
        """BE4e (BEplan §9 BE4.6): every attempt/timeout event for one opportunity, ordered by
        ``attempt_index``, used to derive the opportunity-level aggregation summary."""
        result = await self.session.scalars(
            select(AttemptRecord)
            .where(AttemptRecord.item_opportunity_id == item_opportunity_id)
            .order_by(AttemptRecord.attempt_index)
        )
        return list(result)


class SkillStateTransitionRepository(SqlAlchemyNeutralRepository[SkillStateTransitionRecord]):
    """No update/delete method is defined here by design — transitions are immutable (BEplan
    §9 BE4.4)."""

    model_type = SkillStateTransitionRecord

    async def find_by_opportunity(self, item_opportunity_id: UUID) -> SkillStateTransitionRecord | None:
        return await self.session.scalar(
            select(SkillStateTransitionRecord).where(SkillStateTransitionRecord.item_opportunity_id == item_opportunity_id)
        )

    async def list_for_opportunities(self, item_opportunity_ids: Sequence[UUID]) -> list[SkillStateTransitionRecord]:
        """BE4e (BEplan §9 BE4.6): every first-attempt BKT transition across a set of
        opportunities (one session's), used to build the aggregation's
        ``SkillMasteryUpdate`` inputs. Empty input returns ``[]`` without a query."""
        if not item_opportunity_ids:
            return []
        result = await self.session.scalars(
            select(SkillStateTransitionRecord)
            .where(SkillStateTransitionRecord.item_opportunity_id.in_(item_opportunity_ids))
            .order_by(SkillStateTransitionRecord.created_at_utc, SkillStateTransitionRecord.skill_state_transition_id)
        )
        return list(result)


class HintEventRepository(SqlAlchemyNeutralRepository[HintEventRecord]):
    """BE4d (BEplan §9 BE4.5). SEPARATE from ``AttemptRepository``/``SkillStateTransitionRepository``
    — a hint event never touches attempt or BKT-transition rows."""

    model_type = HintEventRecord

    async def count_for_opportunity(self, item_opportunity_id: UUID) -> int:
        return await self.session.scalar(
            select(func.count()).select_from(HintEventRecord).where(HintEventRecord.item_opportunity_id == item_opportunity_id)
        )


class SessionAggregateResultRepository(SqlAlchemyNeutralRepository[SessionAggregateResultRecord]):
    """BE4e (BEplan §9 BE4.6). No update/delete method by design — immutable, same discipline as
    ``SkillStateTransitionRepository``."""

    model_type = SessionAggregateResultRecord

    async def find_by_session(self, session_id: UUID) -> SessionAggregateResultRecord | None:
        return await self.session.scalar(
            select(SessionAggregateResultRecord).where(SessionAggregateResultRecord.session_id == session_id)
        )


class SkillCertificationResultRepository(SqlAlchemyNeutralRepository[SkillCertificationResultRecord]):
    """BE4e (BEplan §9 BE4.6). No update/delete method by design — immutable."""

    model_type = SkillCertificationResultRecord

    async def list_for_session(self, session_id: UUID) -> list[SkillCertificationResultRecord]:
        result = await self.session.scalars(
            select(SkillCertificationResultRecord).where(SkillCertificationResultRecord.session_id == session_id)
        )
        return list(result)
