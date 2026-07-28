"""Static guards for the BE2 Limited authorization boundary."""

import ast
import re
from pathlib import Path

from app.infrastructure.persistence_models import AUTHORIZED_TABLES, Base
from app.main import app


EXPECTED_TABLES = {
    "app_users",
    "b_learners",
    "app_user_learner_links",
    "b_runtime_bundle_records",
    "b_sessions",
    "b_session_events",
    "b_idempotency_records",
    "b_audit_events",
    "teacher_profiles", "classrooms", "classroom_invites", "classroom_memberships",
    "teacher_profiles", "classrooms", "classroom_invites", "classroom_memberships",
    # BE4a (BEplan §9 BE4.1) — private opportunity/task-instance/presentation-token tables.
    "b_item_opportunities", "b_task_instances", "b_presentation_tokens",
    # BE4b (BEplan §9 BE4.2) — private per-learner, per-skill BKT state.
    "b_learner_skill_states",
    # BE4c (BEplan §9 BE4.3 + BE4.4) — private attempt events + immutable BKT transitions.
    "b_attempts", "b_skill_state_transitions",
    # BE4d (BEplan §9 BE4.5) — private governed hint events, separate from attempts/transitions.
    "b_hint_events",
    # BE4e (BEplan §9 BE4.6) — private, immutable session-aggregate + skill-certification results.
    "b_session_aggregate_results", "b_skill_certification_results",
}
BE2_BASE_TABLES = EXPECTED_TABLES - {
    "teacher_profiles", "classrooms", "classroom_invites", "classroom_memberships",
    "b_item_opportunities", "b_task_instances", "b_presentation_tokens",
    "b_learner_skill_states",
    "b_attempts", "b_skill_state_transitions",
    "b_hint_events",
    "b_session_aggregate_results", "b_skill_certification_results",
}
PROHIBITED_COLUMN_TERMS = {
    "mastery", "bkt", "guess_guard", "certif", "sequenc", "hint", "answer",
    "correct", "error_class", "population", "dd_subtype", "true_mastery",
    "simulated", "latency", "off_day", "random_effect", "experiment",
}
# "answer" and "correct" stay in the blanket prohibition above (blocked everywhere by default).
# BEplan §9 BE4.1 authorizes exactly two PRIVATE columns to carry them — behind the BE3c
# private/public split (never read by any public-DTO projection; see
# ``app.domain.b_opportunity.project_task_instance_to_presentation``) — and only those two cells
# are exempted, via this explicit, minimal allow-list rather than a global term removal.
AUTHORIZED_ANSWER_BEARING_COLUMNS = {
    ("b_task_instances", "correct_answer"),
    ("b_task_instances", "allowed_equivalent_answers"),
}


def test_exact_authorized_model_table_set_and_no_scientific_columns() -> None:
    assert AUTHORIZED_TABLES == EXPECTED_TABLES
    assert set(Base.metadata.tables) == EXPECTED_TABLES

    # The allow-list itself must not be stale: both authorized columns must actually exist on
    # b_task_instances, and no other table may have an answer/correct-bearing column at all.
    table_columns = {
        table.name: {column.name for column in table.columns} for table in Base.metadata.tables.values()
    }
    for table_name, column_name in AUTHORIZED_ANSWER_BEARING_COLUMNS:
        assert column_name in table_columns.get(table_name, set()), (table_name, column_name)
    answer_bearing = {
        (table.name, column.name)
        for table in Base.metadata.tables.values()
        for column in table.columns
        if any(term in column.name.lower() for term in ("answer", "correct"))
    }
    assert answer_bearing == AUTHORIZED_ANSWER_BEARING_COLUMNS

    offenders = {
        (table.name, column.name)
        for table in Base.metadata.tables.values()
        for column in table.columns
        if any(term in column.name.lower() for term in PROHIBITED_COLUMN_TERMS)
        and (table.name, column.name) not in AUTHORIZED_ANSWER_BEARING_COLUMNS
    }
    assert not offenders, offenders


EXPECTED_ROUTES = {
    ("/health/live", ("GET",)),
    ("/health/ready", ("GET",)),
    ("/api/v1/me", ("GET",)),
    ("/api/v1/teacher/profile", ("GET", "POST")),
    ("/api/v1/learner/profile", ("GET", "POST")),
    ("/api/v1/classrooms", ("GET", "POST")),
    ("/api/v1/classrooms/{classroom_id}", ("GET",)),
    ("/api/v1/classrooms/{classroom_id}/invites", ("POST",)),
    ("/api/v1/classroom-invites/{classroom_invite_id}/revoke", ("POST",)),
    ("/api/v1/classroom-invites/resolve", ("POST",)),
    ("/api/v1/classroom-memberships/requests", ("POST",)),
    ("/api/v1/classrooms/{classroom_id}/membership-requests", ("GET",)),
    ("/api/v1/classroom-memberships/{membership_id}/approve", ("POST",)),
    ("/api/v1/classroom-memberships/{membership_id}/reject", ("POST",)),
    ("/api/v1/classrooms/{classroom_id}/learners", ("GET",)),
    ("/api/v1/learner/classrooms", ("GET",)),
    ("/api/v1/b/sessions", ("POST",)),
    ("/api/v1/b/sessions/active", ("GET",)),
    ("/api/v1/b/sessions/{session_id}/complete", ("POST",)),
    ("/api/v1/b/sessions/{session_id}/abandon", ("POST",)),
    # BE4b (BEplan §9 BE4.2) — the one authorized adaptive-selection route.
    ("/api/v1/b/sessions/{session_id}/opportunities", ("POST",)),
    # BE4c (BEplan §9 BE4.3 + BE4.4) — the one authorized attempt-submission route.
    ("/api/v1/b/sessions/{session_id}/opportunities/{item_opportunity_id}/responses", ("POST",)),
    # BE4d (BEplan §9 BE4.5) — the one authorized governed-hint-request route.
    ("/api/v1/b/sessions/{session_id}/opportunities/{item_opportunity_id}/assists", ("POST",)),
    # BE4e (BEplan §9 BE4.6) — the two authorized next-or-complete / SAFE-standing routes.
    ("/api/v1/b/sessions/{session_id}/opportunities/{item_opportunity_id}/complete", ("POST",)),
    ("/api/v1/b/sessions/{session_id}/summary", ("GET",)),
}
AUTHORIZED_INVITE_MEMBERSHIP_OPERATIONS = {
    ("/api/v1/classrooms/{classroom_id}/invites", ("POST",)),
    ("/api/v1/classroom-invites/resolve", ("POST",)),
    ("/api/v1/classroom-memberships/requests", ("POST",)),
    ("/api/v1/classrooms/{classroom_id}/membership-requests", ("GET",)),
    ("/api/v1/classroom-memberships/{membership_id}/approve", ("POST",)),
    ("/api/v1/classroom-memberships/{membership_id}/reject", ("POST",)),
    ("/api/v1/classrooms/{classroom_id}/learners", ("GET",)),
    ("/api/v1/learner/classrooms", ("GET",)),
    ("/api/v1/classroom-invites/{classroom_invite_id}/revoke", ("POST",)),
}
AUTHORIZED_B_SESSION_LIFECYCLE_OPERATIONS = {
    ("/api/v1/b/sessions", ("POST",)),
    ("/api/v1/b/sessions/active", ("GET",)),
    ("/api/v1/b/sessions/{session_id}/complete", ("POST",)),
    ("/api/v1/b/sessions/{session_id}/abandon", ("POST",)),
}
AUTHORIZED_B_OPPORTUNITY_SELECTION_OPERATIONS = {
    ("/api/v1/b/sessions/{session_id}/opportunities", ("POST",)),
}
AUTHORIZED_B_ATTEMPT_SUBMISSION_OPERATIONS = {
    ("/api/v1/b/sessions/{session_id}/opportunities/{item_opportunity_id}/responses", ("POST",)),
}
AUTHORIZED_B_HINT_REQUEST_OPERATIONS = {
    ("/api/v1/b/sessions/{session_id}/opportunities/{item_opportunity_id}/assists", ("POST",)),
}
AUTHORIZED_B_SESSION_COMPLETION_OPERATIONS = {
    ("/api/v1/b/sessions/{session_id}/opportunities/{item_opportunity_id}/complete", ("POST",)),
    ("/api/v1/b/sessions/{session_id}/summary", ("GET",)),
}
PROHIBITED_SCIENTIFIC_PATH_TERMS = (
    "session", "attempt", "hint", "progress", "bkt", "mastery", "sequenc", "certif", "guess",
)


def _current_routes() -> set[tuple[str, tuple[str, ...]]]:
    return {
        (path, tuple(sorted(method.upper() for method in operations)))
        for path, operations in app.openapi()["paths"].items()
    }


def test_no_new_api_route_or_lifecycle_service() -> None:
    assert _current_routes() == EXPECTED_ROUTES
    assert not any(Path("app").rglob("*session*service*.py"))


def test_openapi_contains_exactly_the_nine_authorized_invite_membership_operations() -> None:
    assert len(AUTHORIZED_INVITE_MEMBERSHIP_OPERATIONS) == 9
    assert AUTHORIZED_INVITE_MEMBERSHIP_OPERATIONS <= _current_routes()
    assert _current_routes() - AUTHORIZED_INVITE_MEMBERSHIP_OPERATIONS == {
        route for route in EXPECTED_ROUTES if route not in AUTHORIZED_INVITE_MEMBERSHIP_OPERATIONS
    }


def test_no_session_question_answer_or_scientific_route_exists() -> None:
    """The blanket "session" path prohibition is carved out only for the four
    authorized BE2.3-BE2.4 neutral session-lifecycle routes plus the one BE4b adaptive-
    selection route (BEplan §9 BE4.2) plus the one BE4c attempt-submission route (BEplan §9
    BE4.3 + BE4.4) plus the one BE4d hint-request route (BEplan §9 BE4.5) plus the two BE4e
    next-or-complete / SAFE-standing routes (BEplan §9 BE4.6); every other prohibited scientific
    term remains prohibited unconditionally, including on those routes themselves — in
    particular every route must never contain "attempt", "hint", "progress", "bkt", "mastery",
    "sequenc", "certif", or "guess" (the BE4e routes spell completion as "complete"/"summary",
    never "progress")."""
    for route in _current_routes():
        path, _ = route
        lowered = path.lower()
        terms = PROHIBITED_SCIENTIFIC_PATH_TERMS
        if (
            route in AUTHORIZED_B_SESSION_LIFECYCLE_OPERATIONS
            or route in AUTHORIZED_B_OPPORTUNITY_SELECTION_OPERATIONS
            or route in AUTHORIZED_B_ATTEMPT_SUBMISSION_OPERATIONS
            or route in AUTHORIZED_B_HINT_REQUEST_OPERATIONS
            or route in AUTHORIZED_B_SESSION_COMPLETION_OPERATIONS
        ):
            terms = tuple(term for term in terms if term != "session")
        assert not any(term in lowered for term in terms), path


def test_openapi_contains_exactly_the_two_authorized_b_session_completion_operations() -> None:
    assert len(AUTHORIZED_B_SESSION_COMPLETION_OPERATIONS) == 2
    assert AUTHORIZED_B_SESSION_COMPLETION_OPERATIONS <= _current_routes()
    non_completion_routes = {route for route in EXPECTED_ROUTES if route not in AUTHORIZED_B_SESSION_COMPLETION_OPERATIONS}
    assert _current_routes() - AUTHORIZED_B_SESSION_COMPLETION_OPERATIONS == non_completion_routes


def test_openapi_contains_exactly_the_one_authorized_b_attempt_submission_operation() -> None:
    assert len(AUTHORIZED_B_ATTEMPT_SUBMISSION_OPERATIONS) == 1
    assert AUTHORIZED_B_ATTEMPT_SUBMISSION_OPERATIONS <= _current_routes()
    non_attempt_routes = {route for route in EXPECTED_ROUTES if route not in AUTHORIZED_B_ATTEMPT_SUBMISSION_OPERATIONS}
    assert _current_routes() - AUTHORIZED_B_ATTEMPT_SUBMISSION_OPERATIONS == non_attempt_routes


def test_openapi_contains_exactly_the_one_authorized_b_hint_request_operation() -> None:
    assert len(AUTHORIZED_B_HINT_REQUEST_OPERATIONS) == 1
    assert AUTHORIZED_B_HINT_REQUEST_OPERATIONS <= _current_routes()
    non_hint_routes = {route for route in EXPECTED_ROUTES if route not in AUTHORIZED_B_HINT_REQUEST_OPERATIONS}
    assert _current_routes() - AUTHORIZED_B_HINT_REQUEST_OPERATIONS == non_hint_routes


def test_openapi_contains_exactly_the_four_authorized_b_session_lifecycle_operations() -> None:
    assert len(AUTHORIZED_B_SESSION_LIFECYCLE_OPERATIONS) == 4
    assert AUTHORIZED_B_SESSION_LIFECYCLE_OPERATIONS <= _current_routes()
    non_session_routes = {route for route in EXPECTED_ROUTES if route not in AUTHORIZED_B_SESSION_LIFECYCLE_OPERATIONS}
    assert _current_routes() - AUTHORIZED_B_SESSION_LIFECYCLE_OPERATIONS == non_session_routes


def test_b_session_dto_contains_no_scientific_expiry_or_attempt_fields() -> None:
    """Scans actual DTO field identifiers only (via AST), not prose/docstrings, since
    this module's docstring legitimately documents excluded terms by name."""
    tree = ast.parse(Path("app/domain/b_session.py").read_text(encoding="utf-8"))
    field_names = {
        node.target.id.lower()
        for class_def in ast.walk(tree)
        if isinstance(class_def, ast.ClassDef)
        for node in class_def.body
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name)
    }
    forbidden = PROHIBITED_COLUMN_TERMS | {
        "expires_at", "expiry", "timeout", "question", "attempt", "opportunity",
    }
    assert not {name for name in field_names if any(term in name for term in forbidden)}


def test_no_yass_research_or_scientific_imports() -> None:
    """BE3b wires ``app/infrastructure/live_engine/adapter.py`` to the reviewed
    ``component_b_generator`` package (see ``tests/test_be3_live_engine_boundary.py`` for the
    detailed BE3 import-boundary guards). That one file is therefore exempt from the
    ``component_b_generator`` top-level prohibition here, but not from ``yass``/``pipeline``/
    ``pilot`` — every other file in ``app/`` stays fully disjoint from all of these roots."""
    prohibited_import_roots = {
        "component_b_generator", "yass", "bkt", "sequencing", "certification",
        "guess_guard", "pipeline", "pilot",
    }
    allowed_adapter_path = Path("app/infrastructure/live_engine/adapter.py")
    for path in Path("app").rglob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported = {alias.name.split(".")[0].lower() for alias in node.names}
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported = {node.module.split(".")[0].lower()}
            else:
                continue
            if path == allowed_adapter_path:
                assert imported.isdisjoint({"yass", "pipeline", "pilot"}), (path, imported)
                continue
            assert imported.isdisjoint(prohibited_import_roots), (path, imported)


def test_dependency_files_exclude_research_generator() -> None:
    dependency_files = [
        path
        for name in ("requirements.in", "requirements.lock", "requirements.txt")
        if (path := Path(name)).exists()
    ]
    assert dependency_files
    dependency_text = "\n".join(path.read_text(encoding="utf-8") for path in dependency_files).lower()
    assert "component-b-generator" not in dependency_text
    assert "component_b_generator" not in dependency_text
    assert "yass" not in dependency_text


def test_migration_introduces_only_authorized_tables_and_no_triggers_or_seed_data() -> None:
    migration = Path("migrations/versions/20260722_0002_be2_neutral_persistence.py").read_text(encoding="utf-8")
    created = set(re.findall(r'op\.create_table\(\s*"([^"]+)"', migration))
    assert created == BE2_BASE_TABLES
    lowered = migration.lower()
    assert "create_trigger" not in lowered
    assert "create trigger" not in lowered
    assert "bulk_insert" not in lowered
    assert "op.execute" not in lowered


def test_corrective_migration_adds_only_the_two_authorized_integrity_guards() -> None:
    migration = Path("migrations/versions/20260722_0003_bundle_integrity_guards.py").read_text(
        encoding="utf-8"
    )
    assert not re.findall(r'op\.create_table\(\s*"([^"]+)"', migration)
    assert "enforce_b_session_active_bundle_eligibility" in migration
    assert "trg_b_sessions_active_bundle_eligible" in migration
    assert "enforce_b_runtime_bundle_integrity" in migration
    assert "trg_b_runtime_bundle_integrity" in migration
    lowered = migration.lower()
    assert "insert into" not in lowered
    assert "component_b_generator" not in lowered
    assert "yass" not in lowered


def test_profile_classroom_migration_and_routes_stay_within_authorization() -> None:
    migration = Path("migrations/versions/20260722_0004_profile_classroom_foundations.py").read_text(encoding="utf-8")
    assert set(re.findall(r'op\.create_table\(\s*"([^"]+)"', migration)) == {"teacher_profiles", "classrooms", "classroom_invites", "classroom_memberships"}
    lowered = migration.lower()
    assert "learner_profiles" not in lowered
    assert "bulk_insert" not in lowered
    assert "component_b_generator" not in lowered
    assert "yass" not in lowered
    # The blanket "no invite/membership path" check from the prior limited batch is
    # superseded by the now-authorized invite/membership batch; see
    # test_invite_membership_migration_adds_only_the_authorized_index and
    # test_openapi_contains_exactly_the_nine_authorized_invite_membership_operations
    # for the current, narrower boundary checks. Session/scientific paths remain
    # prohibited unconditionally; see test_no_session_question_answer_or_scientific_route_exists.


def test_invite_membership_migration_adds_only_the_authorized_index() -> None:
    migration = Path("migrations/versions/20260723_0001_classroom_membership_single_approval.py").read_text(encoding="utf-8")
    assert not re.findall(r'op\.create_table\(\s*"([^"]+)"', migration)
    assert not re.findall(r'op\.add_column\(', migration)
    assert not re.findall(r'op\.drop_column\(', migration)
    assert "uq_classroom_memberships_one_approved_per_learner" in migration
    assert '"classroom_memberships"' in migration
    lowered = migration.lower()
    assert "classroom_invites" not in lowered
    assert "create_trigger" not in lowered
    assert "create trigger" not in lowered
    assert "bulk_insert" not in lowered
    assert "component_b_generator" not in lowered
    assert "yass" not in lowered


def test_no_production_failure_injection_or_debug_mechanism() -> None:
    """The corrective batch injects failure only in tests; production code exposes no such hook."""
    markers = (
        "controlled-test-failure", "_failing_audit", "inject_fail", "injectfailure",
        "fail_flag", "failure_flag", "debug_fail", "force_error", "force_failure",
    )
    for path in Path("app").rglob("*.py"):
        lowered = path.read_text(encoding="utf-8").lower()
        for marker in markers:
            assert marker not in lowered, (path, marker)
    paths = set(app.openapi()["paths"])
    assert not any("debug" in path or "inject" in path or "/test" in path for path in paths)
