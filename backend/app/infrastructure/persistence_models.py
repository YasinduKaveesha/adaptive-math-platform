"""Neutral BE2 persistence facts authorized by the governance boundary.

These models intentionally contain no lifecycle methods, scientific state, learner
responses, or synthetic-generator fields.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
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


AUTHORIZED_TABLES = frozenset(Base.metadata.tables)
