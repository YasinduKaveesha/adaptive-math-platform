"""Private/public task representation split (BE3.3).

``PrivateTaskRecord`` is the full private snapshot of one generated task opportunity/instance:
everything needed for grading, provenance, and audit. ``PublicTaskPresentation`` is the safe,
learner-facing DTO built from it. The two are deliberately separate dataclasses — the public one
is constructed field-by-field from an explicit allow-list in ``project_to_public``, never by
copying ``PrivateTaskRecord`` (e.g. via ``dataclasses.asdict``/``replace``) and deleting fields.
That way a newly added private field can never leak into the public DTO by omission; it has to be
explicitly added to the allow-list to appear there at all.

Persisting ``PrivateTaskRecord`` to a database table is BE4.1 scope (private opportunity/
task-instance tables), not this batch — see BEplan BE3.3/BE4.1 boundary note in buildLog.md.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .types import Grade, SelectionReason, TaskConstructionRequest, TaskInstance


@dataclass(frozen=True)
class PrivateTaskRecord:
    """The complete private record of one generated task opportunity/instance.

    Never serialized directly to a learner-facing response. See ``project_to_public``.
    """

    item_opportunity_id: str
    item_instance_id: str
    student_id: str
    item_template_id: str
    skill_id: str
    curriculum_node_id: str
    grade: Grade
    difficulty_level: str
    representation_type: str
    response_format: str
    generated_operands: Mapping[str, object]
    prompt: Mapping[str, object]
    correct_answer: str
    allowed_equivalent_answers: tuple[str, ...]
    distractor_candidates: tuple[str, ...]
    distractor_rule_ids: tuple[str, ...]
    applied_guard_ids: tuple[str, ...]
    generation_seed: int
    global_seed: int
    selection_reason: SelectionReason
    catalogue_version: str
    catalogue_checksum: str
    bundle_version: str


@dataclass(frozen=True)
class PublicTaskPresentation:
    """The safe, allow-listed learner-facing presentation of one task instance.

    Field set is exactly what a learner client needs to render the question and submit an
    answer. It must never carry the correct answer, accepted equivalents, answer rules, seeds,
    BKT parameters, private scores, mastery, or selection rationale.
    """

    item_opportunity_id: str
    item_instance_id: str
    skill_id: str
    grade: Grade
    difficulty_level: str
    representation_type: str
    response_format: str
    prompt: Mapping[str, object]
    presented_choices: tuple[str, ...]

    def to_public_dict(self) -> dict[str, object]:
        """Explicit allow-list serialization: the field list here IS the public contract.

        Never implemented as ``dataclasses.asdict(self)`` on the private record with keys
        popped afterward — every key present here was added on purpose.
        """
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
        }


def build_private_task_record(
    *,
    request: TaskConstructionRequest,
    instance: TaskInstance,
    selection_reason: SelectionReason,
    bundle_version: str,
) -> PrivateTaskRecord:
    """Assemble the private record from the adapter's ``TaskInstance`` output plus the
    provenance the caller already holds (student, curriculum node, selection rationale, the
    session-pinned global seed, and the runtime bundle this instance was built under)."""
    return PrivateTaskRecord(
        item_opportunity_id=instance.item_opportunity_id,
        item_instance_id=instance.item_instance_id,
        student_id=request.student_id,
        item_template_id=instance.item_template_id,
        skill_id=instance.skill_id,
        curriculum_node_id=request.curriculum_node_id,
        grade=instance.grade,
        difficulty_level=instance.difficulty_level,
        representation_type=instance.representation_type,
        response_format=instance.response_format,
        generated_operands=dict(instance.generated_operands),
        prompt=dict(instance.prompt),
        correct_answer=instance.correct_answer,
        allowed_equivalent_answers=instance.allowed_equivalent_answers,
        distractor_candidates=instance.distractor_candidates,
        distractor_rule_ids=instance.distractor_rule_ids,
        applied_guard_ids=instance.applied_guard_ids,
        generation_seed=instance.generation_seed,
        global_seed=request.global_seed,
        selection_reason=selection_reason,
        catalogue_version=instance.catalogue_version,
        catalogue_checksum=instance.catalogue_checksum,
        bundle_version=bundle_version,
    )


def project_to_public(private: PrivateTaskRecord) -> PublicTaskPresentation:
    """Build the safe public DTO from an explicit allow-list of private fields.

    Only the fields named on the right-hand side below are read from ``private``; every other
    private field (correct answer, equivalents, distractor provenance, seeds, selection
    rationale, catalogue/bundle version) is structurally unreachable from the return value.
    """
    if private.distractor_candidates:
        presented_choices: tuple[str, ...] = tuple(
            sorted({private.correct_answer, *private.distractor_candidates})
        )
    else:
        presented_choices = ()

    return PublicTaskPresentation(
        item_opportunity_id=private.item_opportunity_id,
        item_instance_id=private.item_instance_id,
        skill_id=private.skill_id,
        grade=private.grade,
        difficulty_level=private.difficulty_level,
        representation_type=private.representation_type,
        response_format=private.response_format,
        prompt=dict(private.prompt),
        presented_choices=presented_choices,
    )
