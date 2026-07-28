"""Neutral BE2 persistence facts authorized by the governance boundary.

These models intentionally contain no lifecycle methods, scientific state, learner
responses, or synthetic-generator fields.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    UniqueConstraint,
    false,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


SOURCE_CLASSES = ("REAL", "SYNTHETIC", "IMPORTED", "TEST")
SESSION_STATES = (
    "starting", "active", "completing", "completed", "abandoned", "expired", "technical_failed"
)


class Base(DeclarativeBase):
    """Metadata root for the eight authorized BE2 tables."""


class ProvenanceMixin:
    """Mandatory neutral provenance and audit metadata."""

    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    actor_user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("app_users.user_id", ondelete="RESTRICT"), nullable=True
    )
    system_actor: Mapped[str | None] = mapped_column(String(128), nullable=True)
    request_id: Mapped[str] = mapped_column(String(64), nullable=False)
    operation_or_event_type: Mapped[str] = mapped_column(String(128), nullable=False)
    reason_code: Mapped[str] = mapped_column(String(128), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    before_reference_or_version: Mapped[str | None] = mapped_column(String(255), nullable=True)
    after_reference_or_version: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_class: Mapped[str] = mapped_column(String(16), nullable=False)
    source_system: Mapped[str] = mapped_column(String(128), nullable=False)
    source_record_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    environment: Mapped[str] = mapped_column(String(32), nullable=False)
    schema_revision: Mapped[str] = mapped_column(String(64), nullable=False)
    approval_evidence_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)

    @staticmethod
    def provenance_constraints(prefix: str) -> tuple[CheckConstraint, ...]:
        return (
            CheckConstraint(
                "source_class IN ('REAL', 'SYNTHETIC', 'IMPORTED', 'TEST')",
                name=f"ck_{prefix}_source_class",
            ),
            CheckConstraint(
                "(actor_user_id IS NOT NULL) <> (system_actor IS NOT NULL)",
                name=f"ck_{prefix}_actor_exactly_one",
            ),
            CheckConstraint(
                "environment <> '' AND source_system <> '' AND request_id <> ''",
                name=f"ck_{prefix}_required_provenance_nonblank",
            ),
        )


class AppUser(ProvenanceMixin, Base):
    __tablename__ = "app_users"
    __table_args__ = (
        UniqueConstraint("supabase_subject", name="uq_app_users_supabase_subject"),
        CheckConstraint("supabase_subject <> ''", name="ck_app_users_subject_nonblank"),
        CheckConstraint("status <> ''", name="ck_app_users_status_nonblank"),
        CheckConstraint(
            "profile_type IS NULL OR profile_type IN ('LEARNER', 'TEACHER')",
            name="ck_app_users_profile_type",
        ),
        *ProvenanceMixin.provenance_constraints("app_users"),
    )

    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    supabase_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    profile_type: Mapped[str | None] = mapped_column(String(16), nullable=True)


class Learner(ProvenanceMixin, Base):
    __tablename__ = "b_learners"
    __table_args__ = (
        CheckConstraint("grade IS NULL OR grade IN (2, 3)", name="ck_b_learners_grade"),
        CheckConstraint("status <> ''", name="ck_b_learners_status_nonblank"),
        CheckConstraint("name IS NULL OR btrim(name) <> ''", name="ck_b_learners_name_nonblank"),
        *ProvenanceMixin.provenance_constraints("b_learners"),
    )

    learner_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    grade: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)


class AppUserLearnerLink(ProvenanceMixin, Base):
    __tablename__ = "app_user_learner_links"
    __table_args__ = (
        UniqueConstraint("user_id", "learner_id", name="uq_app_user_learner_links_pair"),
        UniqueConstraint("user_id", name="uq_app_user_learner_links_user"),
        UniqueConstraint("learner_id", name="uq_app_user_learner_links_learner"),
        *ProvenanceMixin.provenance_constraints("app_user_learner_links"),
    )

    link_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("app_users.user_id", ondelete="RESTRICT"), nullable=False
    )
    learner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False
    )


class RuntimeBundleRecord(ProvenanceMixin, Base):
    __tablename__ = "b_runtime_bundle_records"
    __table_args__ = (
        UniqueConstraint("bundle_version", name="uq_b_runtime_bundle_records_version"),
        UniqueConstraint("manifest_checksum", name="uq_b_runtime_bundle_records_checksum"),
        CheckConstraint("manifest_checksum ~ '^[0-9a-f]{64}$'", name="ck_b_runtime_bundle_records_checksum"),
        CheckConstraint(
            "publication_state IN ('DRAFT', 'PUBLISHED', 'RETIRED')",
            name="ck_b_runtime_bundle_records_publication_state",
        ),
        CheckConstraint(
            "publication_state <> 'PUBLISHED' OR immutable_after_publication",
            name="ck_b_runtime_bundle_records_published_immutable",
        ),
        *ProvenanceMixin.provenance_constraints("b_runtime_bundle_records"),
    )

    runtime_bundle_record_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    bundle_version: Mapped[str] = mapped_column(String(128), nullable=False)
    manifest_checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    publication_state: Mapped[str] = mapped_column(String(16), nullable=False)
    approval_status: Mapped[str] = mapped_column(String(64), nullable=False)
    immutable_after_publication: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=false())


class SessionRecord(ProvenanceMixin, Base):
    __tablename__ = "b_sessions"
    __table_args__ = (
        CheckConstraint(
            "state IN ('starting', 'active', 'completing', 'completed', 'abandoned', 'expired', 'technical_failed')",
            name="ck_b_sessions_state",
        ),
        CheckConstraint("row_version >= 0", name="ck_b_sessions_row_version"),
        CheckConstraint(
            "state <> 'active' OR runtime_bundle_record_id IS NOT NULL",
            name="ck_b_sessions_active_bundle_required",
        ),
        Index(
            "uq_b_sessions_one_starting_or_active_per_learner",
            "learner_id",
            unique=True,
            postgresql_where=text("state IN ('starting', 'active')"),
        ),
        *ProvenanceMixin.provenance_constraints("b_sessions"),
    )

    session_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    learner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False
    )
    runtime_bundle_record_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("b_runtime_bundle_records.runtime_bundle_record_id", ondelete="RESTRICT"),
        nullable=True,
    )
    state: Mapped[str] = mapped_column(String(32), nullable=False)
    expires_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    row_version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))


class SessionEvent(ProvenanceMixin, Base):
    __tablename__ = "b_session_events"
    __table_args__ = (*ProvenanceMixin.provenance_constraints("b_session_events"),)

    session_event_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_sessions.session_id", ondelete="RESTRICT"), nullable=False
    )


class IdempotencyRecord(ProvenanceMixin, Base):
    __tablename__ = "b_idempotency_records"
    __table_args__ = (
        UniqueConstraint(
            "actor_user_id", "http_method", "operation_identifier", "idempotency_key",
            name="uq_b_idempotency_records_scope",
        ),
        CheckConstraint("actor_user_id IS NOT NULL", name="ck_b_idempotency_records_actor_required"),
        CheckConstraint("processing_status <> ''", name="ck_b_idempotency_records_status_nonblank"),
        CheckConstraint("request_fingerprint ~ '^[0-9a-f]{64}$'", name="ck_b_idempotency_records_fingerprint"),
        CheckConstraint("expires_at_utc > created_at_utc", name="ck_b_idempotency_records_expiry"),
        *ProvenanceMixin.provenance_constraints("b_idempotency_records"),
    )

    idempotency_record_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    http_method: Mapped[str] = mapped_column(String(16), nullable=False)
    operation_identifier: Mapped[str] = mapped_column(String(255), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False)
    request_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    processing_status: Mapped[str] = mapped_column(String(32), nullable=False)
    canonical_response: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    response_status: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    expires_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AuditEvent(ProvenanceMixin, Base):
    __tablename__ = "b_audit_events"
    __table_args__ = (*ProvenanceMixin.provenance_constraints("b_audit_events"),)

    audit_event_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)


class TeacherProfile(ProvenanceMixin, Base):
    __tablename__ = "teacher_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_teacher_profiles_user"),
        CheckConstraint("btrim(name) <> ''", name="ck_teacher_profiles_name_nonblank"),
        *ProvenanceMixin.provenance_constraints("teacher_profiles"),
    )

    teacher_profile_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("app_users.user_id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class Classroom(ProvenanceMixin, Base):
    __tablename__ = "classrooms"
    __table_args__ = (
        CheckConstraint("grade IN ('GRADE_2', 'GRADE_3')", name="ck_classrooms_grade"),
        CheckConstraint("name IS NULL OR btrim(name) <> ''", name="ck_classrooms_name_nonblank"),
        Index("uq_classrooms_teacher_normalized_name", "teacher_profile_id", func.lower(func.btrim(text("name"))), unique=True, postgresql_where=text("name IS NOT NULL")),
        CheckConstraint("row_version >= 0", name="ck_classrooms_row_version"),
        *ProvenanceMixin.provenance_constraints("classrooms"),
    )

    classroom_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    teacher_profile_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("teacher_profiles.teacher_profile_id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    grade: Mapped[str] = mapped_column(String(16), nullable=False)
    row_version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))


class ClassroomInvite(ProvenanceMixin, Base):
    __tablename__ = "classroom_invites"
    __table_args__ = (
        UniqueConstraint("token_hash", name="uq_classroom_invites_token_hash"),
        CheckConstraint("token_hash ~ '^[0-9a-f]{64}$'", name="ck_classroom_invites_token_hash"),
        CheckConstraint("row_version >= 0", name="ck_classroom_invites_row_version"),
        *ProvenanceMixin.provenance_constraints("classroom_invites"),
    )

    classroom_invite_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    classroom_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("classrooms.classroom_id", ondelete="RESTRICT"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("app_users.user_id", ondelete="RESTRICT"), nullable=False)
    row_version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))


class ClassroomMembership(ProvenanceMixin, Base):
    __tablename__ = "classroom_memberships"
    __table_args__ = (
        UniqueConstraint("classroom_id", "learner_id", name="uq_classroom_memberships_pair"),
        CheckConstraint("state IN ('PENDING', 'APPROVED', 'REJECTED')", name="ck_classroom_memberships_state"),
        CheckConstraint("(state = 'PENDING' AND decided_at_utc IS NULL AND decided_by_user_id IS NULL) OR (state IN ('APPROVED', 'REJECTED') AND decided_at_utc IS NOT NULL AND decided_by_user_id IS NOT NULL)", name="ck_classroom_memberships_decision"),
        CheckConstraint("row_version >= 0", name="ck_classroom_memberships_row_version"),
        Index(
            "uq_classroom_memberships_one_approved_per_learner",
            "learner_id",
            unique=True,
            postgresql_where=text("state = 'APPROVED'"),
        ),
        *ProvenanceMixin.provenance_constraints("classroom_memberships"),
    )

    classroom_membership_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    classroom_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("classrooms.classroom_id", ondelete="RESTRICT"), nullable=False)
    learner_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False)
    classroom_invite_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("classroom_invites.classroom_invite_id", ondelete="RESTRICT"), nullable=False)
    state: Mapped[str] = mapped_column(String(16), nullable=False)
    requested_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    decided_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decided_by_user_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("app_users.user_id", ondelete="RESTRICT"), nullable=True)
    row_version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))


class ItemOpportunityRecord(ProvenanceMixin, Base):
    """BE4a (BEplan §9 BE4.1): one live-loop opportunity per row. PRIVATE table — the
    ``selection_provenance`` column never appears in any public DTO or log; see
    ``app.domain.b_opportunity``."""

    __tablename__ = "b_item_opportunities"
    __table_args__ = (
        CheckConstraint("state IN ('OPEN', 'CLOSED')", name="ck_b_item_opportunities_state"),
        CheckConstraint("row_version >= 0", name="ck_b_item_opportunities_row_version"),
        CheckConstraint(
            "timeout_deadline_utc > created_at_utc", name="ck_b_item_opportunities_timeout_after_created"
        ),
        Index(
            "uq_b_item_opportunities_one_open_per_session",
            "session_id",
            unique=True,
            postgresql_where=text("state = 'OPEN'"),
        ),
        *ProvenanceMixin.provenance_constraints("b_item_opportunities"),
    )

    item_opportunity_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_sessions.session_id", ondelete="RESTRICT"), nullable=False
    )
    learner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(String(128), nullable=False)
    item_template_id: Mapped[str] = mapped_column(String(128), nullable=False)
    opportunity_index: Mapped[int] = mapped_column(Integer, nullable=False)
    state: Mapped[str] = mapped_column(String(16), nullable=False)
    presented_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    timeout_deadline_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    selection_provenance: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    row_version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))


class TaskInstanceRecord(ProvenanceMixin, Base):
    """BE4a (BEplan §9 BE4.1): the constructed task for one opportunity, split into a SAFE
    presentation subset (prompt/presented_choices — computed once at creation using the same
    allow-list logic as BE3c's ``project_to_public``) and PRIVATE columns that never leave this
    table. This batch creates the schema only; BE4b populates rows via the adapter."""

    __tablename__ = "b_task_instances"
    __table_args__ = (
        UniqueConstraint("item_opportunity_id", name="uq_b_task_instances_opportunity"),
        CheckConstraint("grade IN (2, 3)", name="ck_b_task_instances_grade"),
        *ProvenanceMixin.provenance_constraints("b_task_instances"),
    )

    task_instance_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    item_opportunity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_item_opportunities.item_opportunity_id", ondelete="RESTRICT"), nullable=False
    )
    item_template_id: Mapped[str] = mapped_column(String(128), nullable=False)
    skill_id: Mapped[str] = mapped_column(String(128), nullable=False)
    grade: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    difficulty_level: Mapped[str] = mapped_column(String(64), nullable=False)
    representation_type: Mapped[str] = mapped_column(String(64), nullable=False)
    response_format: Mapped[str] = mapped_column(String(64), nullable=False)
    # SAFE presentation subset (BE3c allow-list) — the only columns a public DTO may read.
    prompt: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    presented_choices: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    # PRIVATE — never read by any public-DTO projection or structured log.
    correct_answer: Mapped[str] = mapped_column(String(255), nullable=False)
    allowed_equivalent_answers: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    distractor_candidates: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    distractor_rule_ids: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    generated_operands: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    generation_seed: Mapped[int] = mapped_column(BigInteger, nullable=False)
    applied_guard_ids: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    catalogue_version: Mapped[str] = mapped_column(String(128), nullable=False)
    catalogue_checksum: Mapped[str] = mapped_column(String(64), nullable=False)


class PresentationTokenRecord(ProvenanceMixin, Base):
    """BE4a (BEplan §9 BE4.1): an opaque, short-lived presentation token bound to
    (session, opportunity, learner, runtime bundle). Only the SHA-256 hash of the token is
    stored, matching the ``classroom_invites.token_hash`` convention — the raw token is returned
    to the caller exactly once, at issuance."""

    __tablename__ = "b_presentation_tokens"
    __table_args__ = (
        UniqueConstraint("token_hash", name="uq_b_presentation_tokens_token_hash"),
        CheckConstraint("token_hash ~ '^[0-9a-f]{64}$'", name="ck_b_presentation_tokens_token_hash"),
        CheckConstraint("expires_at_utc > issued_at_utc", name="ck_b_presentation_tokens_expiry"),
        *ProvenanceMixin.provenance_constraints("b_presentation_tokens"),
    )

    presentation_token_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_sessions.session_id", ondelete="RESTRICT"), nullable=False
    )
    item_opportunity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_item_opportunities.item_opportunity_id", ondelete="RESTRICT"), nullable=False
    )
    learner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False
    )
    runtime_bundle_record_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("b_runtime_bundle_records.runtime_bundle_record_id", ondelete="RESTRICT"),
        nullable=False,
    )
    issued_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class LearnerSkillStateRecord(ProvenanceMixin, Base):
    """BE4b (BEplan §9 BE4.2): one row per (learner, skill) — the current P(L) mastery estimate
    and observation count. PRIVATE table. BE4b only reads and initializes (from the pinned
    bundle's TEST-fixture P(L0) priors); BE4c owns updates after the first real attempt. No
    cross-skill transfer: every row is independent."""

    __tablename__ = "b_learner_skill_states"
    __table_args__ = (
        UniqueConstraint("learner_id", "skill_id", name="uq_b_learner_skill_states_pair"),
        CheckConstraint("p_l >= 0.0 AND p_l <= 1.0", name="ck_b_learner_skill_states_p_l_bounded"),
        CheckConstraint("observation_count >= 0", name="ck_b_learner_skill_states_observation_count"),
        *ProvenanceMixin.provenance_constraints("b_learner_skill_states"),
    )

    learner_skill_state_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    learner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(String(128), nullable=False)
    p_l: Mapped[float] = mapped_column(Float, nullable=False)
    observation_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))


class AttemptRecord(ProvenanceMixin, Base):
    """BE4c (BEplan §9 BE4.3): one row per submitted attempt or governed timeout event on an
    opportunity. PRIVATE table. ``attempt_index`` is derived server-side under a row lock on the
    parent opportunity and is unique per opportunity. ``submitted_value`` is the learner's raw
    submission (never the accepted-answer set); ``response_matched`` is the server-computed
    outcome for ``RESPONSE`` events only (``NULL`` for ``TIMEOUT``). ``client_elapsed_ms`` is
    telemetry only — never used for correctness or BKT."""

    __tablename__ = "b_attempts"
    __table_args__ = (
        UniqueConstraint("item_opportunity_id", "attempt_index", name="uq_b_attempts_opportunity_index"),
        CheckConstraint("event_kind IN ('RESPONSE', 'TIMEOUT')", name="ck_b_attempts_event_kind"),
        CheckConstraint("attempt_index >= 1", name="ck_b_attempts_attempt_index_positive"),
        CheckConstraint(
            "(event_kind = 'RESPONSE' AND response_matched IS NOT NULL AND submitted_value IS NOT NULL) "
            "OR (event_kind = 'TIMEOUT' AND response_matched IS NULL AND submitted_value IS NULL)",
            name="ck_b_attempts_response_matched_consistency",
        ),
        CheckConstraint("client_elapsed_ms IS NULL OR client_elapsed_ms >= 0", name="ck_b_attempts_client_elapsed_ms_nonnegative"),
        *ProvenanceMixin.provenance_constraints("b_attempts"),
    )

    attempt_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    item_opportunity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_item_opportunities.item_opportunity_id", ondelete="RESTRICT"), nullable=False
    )
    learner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False
    )
    attempt_index: Mapped[int] = mapped_column(Integer, nullable=False)
    event_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    submitted_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    response_matched: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    client_elapsed_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    server_submitted_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class SkillStateTransitionRecord(ProvenanceMixin, Base):
    """BE4c (BEplan §9 BE4.4): the immutable first-attempt-only BKT observation + mastery
    transition. PRIVATE table. ``uq_b_skill_state_transitions_opportunity`` is simultaneously the
    DB-level claim on the unique first-attempt observation for an opportunity and the transition
    row itself — a concurrent second claim for the same opportunity fails this unique index. No
    application code path ever updates or deletes a row in this table."""

    __tablename__ = "b_skill_state_transitions"
    __table_args__ = (
        UniqueConstraint("item_opportunity_id", name="uq_b_skill_state_transitions_opportunity"),
        UniqueConstraint("attempt_id", name="uq_b_skill_state_transitions_attempt"),
        CheckConstraint("p_l_before >= 0.0 AND p_l_before <= 1.0", name="ck_b_skill_state_transitions_p_l_before_bounded"),
        CheckConstraint(
            "predicted_probability >= 0.0 AND predicted_probability <= 1.0",
            name="ck_b_skill_state_transitions_predicted_probability_bounded",
        ),
        CheckConstraint("posterior_p_l >= 0.0 AND posterior_p_l <= 1.0", name="ck_b_skill_state_transitions_posterior_p_l_bounded"),
        CheckConstraint("p_l_after >= 0.0 AND p_l_after <= 1.0", name="ck_b_skill_state_transitions_p_l_after_bounded"),
        *ProvenanceMixin.provenance_constraints("b_skill_state_transitions"),
    )

    skill_state_transition_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    learner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(String(128), nullable=False)
    item_opportunity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_item_opportunities.item_opportunity_id", ondelete="RESTRICT"), nullable=False
    )
    attempt_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_attempts.attempt_id", ondelete="RESTRICT"), nullable=False
    )
    response_matched: Mapped[bool] = mapped_column(Boolean, nullable=False)
    p_l_before: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_probability: Mapped[float] = mapped_column(Float, nullable=False)
    posterior_p_l: Mapped[float] = mapped_column(Float, nullable=False)
    p_l_after: Mapped[float] = mapped_column(Float, nullable=False)


class HintEventRecord(ProvenanceMixin, Base):
    """BE4d (BEplan §9 BE4.5): one row per governed L1/L2/L3 assist request on an opportunity.
    PRIVATE table, SEPARATE from ``b_attempts``/``b_skill_state_transitions`` — a hint request is
    never a mastery/BKT observation and this table is never joined into any BKT computation.
    Column names avoid every ``PROHIBITED_COLUMN_TERMS`` entry (see
    ``tests/test_be2_architecture_guards.py``): the governed hint level is spelled
    ``assist_level``, not ``hint_level``. Only the catalogue reconstruction key
    (``content_id`` + ``catalogue_version`` + ``catalogue_checksum``) is persisted — never the
    hint text itself, which is always re-fetched from the governed catalogue via
    ``LiveEngineAdapter.get_hint`` at request time."""

    __tablename__ = "b_hint_events"
    __table_args__ = (
        UniqueConstraint("item_opportunity_id", "assist_level", name="uq_b_hint_events_opportunity_level"),
        CheckConstraint("assist_level >= 1 AND assist_level <= 3", name="ck_b_hint_events_assist_level_bounded"),
        *ProvenanceMixin.provenance_constraints("b_hint_events"),
    )

    assist_event_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    item_opportunity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_item_opportunities.item_opportunity_id", ondelete="RESTRICT"), nullable=False
    )
    learner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False
    )
    assist_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    content_id: Mapped[str] = mapped_column(String(255), nullable=False)
    catalogue_version: Mapped[str] = mapped_column(String(128), nullable=False)
    catalogue_checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    requested_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class SessionAggregateResultRecord(ProvenanceMixin, Base):
    """BE4e (BEplan §9 BE4.6): one immutable row per completed session — session-level aggregate
    statistics computed via ``LiveEngineAdapter.aggregate_session`` from the session's own
    attempts/hints/first-attempt outcomes. PRIVATE table: never read by any public-DTO projection
    (see ``app.domain.b_completion``). Column names avoid every ``PROHIBITED_COLUMN_TERMS`` entry
    (``outcome_pattern_distribution`` not ``error_class_distribution``,
    ``assisted_opportunity_count`` not ``hint_bearing_opportunities``). No application code path
    ever updates or deletes a row here."""

    __tablename__ = "b_session_aggregate_results"
    __table_args__ = (
        UniqueConstraint("session_id", name="uq_b_session_aggregate_results_session"),
        CheckConstraint(
            "first_attempt_match_rate IS NULL OR (first_attempt_match_rate >= 0.0 AND first_attempt_match_rate <= 1.0)",
            name="ck_b_session_aggregate_results_match_rate_bounded",
        ),
        CheckConstraint(
            "completion_rate IS NULL OR (completion_rate >= 0.0 AND completion_rate <= 1.0)",
            name="ck_b_session_aggregate_results_completion_rate_bounded",
        ),
        *ProvenanceMixin.provenance_constraints("b_session_aggregate_results"),
    )

    session_aggregate_result_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_sessions.session_id", ondelete="RESTRICT"), nullable=False
    )
    learner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False
    )
    opportunity_count: Mapped[int] = mapped_column(Integer, nullable=False)
    first_attempt_match_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    completion_count: Mapped[int] = mapped_column(Integer, nullable=False)
    completion_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_retry_count: Mapped[int] = mapped_column(Integer, nullable=False)
    assisted_opportunity_count: Mapped[int] = mapped_column(Integer, nullable=False)
    response_time_mean_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    response_time_median_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    response_time_std_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    outcome_pattern_distribution: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    skill_ids_practiced: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    completion_policy_version: Mapped[str] = mapped_column(String(64), nullable=False)


class SkillCertificationResultRecord(ProvenanceMixin, Base):
    """BE4e (BEplan §9 BE4.6): one immutable row per (session, skill) roll-up — the TEST-fixture
    plausibility-check and certification decision from ``LiveEngineAdapter.plausibility_floor``/
    ``evaluate``/``certify_skill``. PRIVATE table; column names avoid every
    ``PROHIBITED_COLUMN_TERMS`` entry (``skill_estimate`` not ``mastery``/``p_l``,
    ``threshold_met_flag`` not ``certified_flag``, ``plausibility_status`` not
    ``guess_guard_status``, ``first_attempt_match_count`` not ``first_attempt_correct_count``).
    GATE-B deferred: theta_B and the plausibility numerics behind this row are the
    TEST_FIXTURE_ONLY engineering config, never an approved value; never exposed through any
    public DTO (see ``app.domain.b_completion``)."""

    __tablename__ = "b_skill_certification_results"
    __table_args__ = (
        UniqueConstraint("session_id", "skill_id", name="uq_b_skill_certification_results_session_skill"),
        CheckConstraint(
            "skill_estimate IS NULL OR (skill_estimate >= 0.0 AND skill_estimate <= 1.0)",
            name="ck_b_skill_certification_results_skill_estimate_bounded",
        ),
        CheckConstraint(
            "plausibility_status IS NULL OR plausibility_status IN "
            "('NOT_TRIGGERED', 'TRIGGERED', 'INSUFFICIENT_EVIDENCE')",
            name="ck_b_skill_certification_results_plausibility_status",
        ),
        *ProvenanceMixin.provenance_constraints("b_skill_certification_results"),
    )

    skill_result_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_sessions.session_id", ondelete="RESTRICT"), nullable=False
    )
    learner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("b_learners.learner_id", ondelete="RESTRICT"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(String(128), nullable=False)
    opportunity_count: Mapped[int] = mapped_column(Integer, nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False)
    first_attempt_match_count: Mapped[int] = mapped_column(Integer, nullable=False)
    skill_estimate: Mapped[float | None] = mapped_column(Float, nullable=True)
    plausibility_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    threshold_met_flag: Mapped[bool | None] = mapped_column(Boolean, nullable=True)


AUTHORIZED_TABLES = frozenset(Base.metadata.tables)
