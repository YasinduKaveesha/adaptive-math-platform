"""BE4a: opportunity/task-instance presentation domain types (BEplan §9 BE4.1).

Persistence + presentation-token layer only — no selection science, no adapter calls, no
BKT/hints/scoring. Reuses the BE3c private/public split (``app.domain.live_engine.presentation``)
rather than reinventing it: ``PresentedOpportunity`` is the safe, allow-listed learner-facing
projection of a persisted ``TaskInstanceRecord`` row, built the same way
``project_to_public`` builds ``PublicTaskPresentation`` — by naming every field explicitly, never
by copying the private record and deleting keys. It must never carry the correct answer, accepted
equivalents, distractor rule ids, generation seed, catalogue version/checksum, applied guard ids,
or selection provenance.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import TYPE_CHECKING, Mapping

from app.domain.b_session import StrictModel


if TYPE_CHECKING:
    from app.infrastructure.persistence_models import TaskInstanceRecord


OPPORTUNITY_STATES = ("OPEN", "CLOSED")


class PresentationTokenError(Exception):
    """Base class for fail-closed presentation-token validation failures."""


class PresentationTokenNotFoundError(PresentationTokenError):
    pass


class PresentationTokenExpiredError(PresentationTokenError):
    pass


class PresentationTokenMismatchError(PresentationTokenError):
    """Token does not bind to the given session/opportunity/learner."""


@dataclass(frozen=True)
class PresentedOpportunity:
    """The safe, allow-listed learner-facing presentation of one opportunity (BEplan BE4.1).

    Field set is exactly what a learner client needs to render the question, submit an answer,
    and respect the server-authoritative timeout. Never constructed via ``dataclasses.asdict``
    or ``replace`` on a private record — see ``project_task_instance_to_presentation``.
    """

    item_opportunity_id: str
    item_instance_id: str
    skill_id: str
    grade: int
    difficulty_level: str
    representation_type: str
    response_format: str
    prompt: Mapping[str, object]
    presented_choices: tuple[str, ...]
    presentation_token: str
    server_timeout_deadline_utc: datetime

    def to_public_dict(self) -> dict[str, object]:
        """Explicit allow-list serialization: the field list here IS the public contract."""
        return {
            "item_opportunity_id": self.item_opportunity_id,
            "item_instance_id": self.item_instance_id,
            "skill_id": self.skill_id,
            "grade": self.grade,
            "difficulty_level": self.difficulty_level,
            "representation_type": self.representation_type,
            "response_format": self.response_format,
            "prompt": dict(self.prompt),
            "presented_choices": list(self.presented_choices),
            "presentation_token": self.presentation_token,
            "server_timeout_deadline_utc": self.server_timeout_deadline_utc.isoformat(),
        }


def project_task_instance_to_presentation(
    task_instance: "TaskInstanceRecord",
    *,
    presentation_token: str,
    server_timeout_deadline_utc: datetime,
) -> PresentedOpportunity:
    """Build the safe DTO from an explicit allow-list of ``TaskInstanceRecord`` columns.

    Only the SAFE columns named on the right-hand side below are read; the PRIVATE columns
    (``correct_answer``, ``allowed_equivalent_answers``, ``distractor_candidates``,
    ``distractor_rule_ids``, ``generated_operands``, ``generation_seed``, ``catalogue_version``,
    ``catalogue_checksum``, ``applied_guard_ids``) are structurally unreachable from the return
    value.
    """
    return PresentedOpportunity(
        item_opportunity_id=str(task_instance.item_opportunity_id),
        item_instance_id=str(task_instance.task_instance_id),
        skill_id=task_instance.skill_id,
        grade=task_instance.grade,
        difficulty_level=task_instance.difficulty_level,
        representation_type=task_instance.representation_type,
        response_format=task_instance.response_format,
        prompt=dict(task_instance.prompt),
        presented_choices=tuple(task_instance.presented_choices),
        presentation_token=presentation_token,
        server_timeout_deadline_utc=server_timeout_deadline_utc,
    )


class OpportunityPresentationFields(StrictModel):
    """BE4b (BEplan §9 BE4.2) public response shape — an explicit, field-by-field mirror of
    ``PresentedOpportunity`` (never ``**PresentedOpportunity.to_public_dict()``), so the FastAPI
    response schema and the safe-DTO allow-list are two independently-written descriptions of the
    same safe field set rather than one generated from the other."""

    item_opportunity_id: str
    item_instance_id: str
    skill_id: str
    grade: int
    difficulty_level: str
    representation_type: str
    response_format: str
    prompt: Mapping[str, object]
    presented_choices: tuple[str, ...]
    presentation_token: str
    server_timeout_deadline_utc: datetime


class OpportunityPresentationResponse(OpportunityPresentationFields):
    request_id: str


def opportunity_presentation_fields(presented: PresentedOpportunity) -> OpportunityPresentationFields:
    """Explicit field-by-field mapping from the safe dataclass to the safe pydantic response
    shape — see the allow-list discipline note on ``OpportunityPresentationFields``."""
    return OpportunityPresentationFields(
        item_opportunity_id=presented.item_opportunity_id,
        item_instance_id=presented.item_instance_id,
        skill_id=presented.skill_id,
        grade=presented.grade,
        difficulty_level=presented.difficulty_level,
        representation_type=presented.representation_type,
        response_format=presented.response_format,
        prompt=presented.prompt,
        presented_choices=presented.presented_choices,
        presentation_token=presented.presentation_token,
        server_timeout_deadline_utc=presented.server_timeout_deadline_utc,
    )
