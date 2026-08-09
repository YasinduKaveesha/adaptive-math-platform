# Component B — Measurement Integrity & Doc-vs-Code Parity Review

**Reviewer:** independent review pass (not the builder of this system).
**Date:** 2026-08-01
**Scope, as commissioned:** (1) measurement / research-data integrity, (2) doc-vs-code discrepancy
audit. **Static read only** — no tests were run, no code was executed, nothing was modified.
**Out of scope by instruction:** any proposed change to a BKT parameter, certification threshold,
or sequencing weight (governance decisions, not review findings); question content and
age-appropriateness.

**Subject:** `Upadya/Dev/backend/`, read against the research repository
`Yass/Implementation_v1.0/` (Component B dataset generator + shared orchestrator).

---

## 1. Verdict

**Engineering-complete against its own stated scope, with one measurement defect that should be
closed before any data-collecting run and one already-tracked defect that is correctly open.**

This is explicitly **not** a pilot-readiness or scientific-validity judgement. Gate B is
unresolved, every scientific parameter except the B-022 sequencing weights is an unapproved
placeholder, and no real child may use this system. Nothing in this review changes that.

The headline result is a **confirmation, not an indictment**. The architecture's central claim —
that the live backend runs the same reviewed science as the offline dataset generator — is
**substantially true and independently verifiable**. Every core scientific module is byte-identical
across the two repositories. The divergences that exist are deliberate, documented in-file, and
justified against a provenance record. This is unusually disciplined work for a research codebase.

Two things stand between the current state and a defensible data-collecting run:

- **F1** — the shipped engine predates a B→3 contract fix that already exists upstream (medium).
- **F2** — the timeout path destroys learner submissions irreversibly (high, already tracked as
  Known Issue 2, correctly documented as open).

---

## 2. Findings

Severity reflects **research-data impact**, not user-facing impact. Findings are marked **active**
(corrupts data on a path that runs today), **latent** (would corrupt data when a path is
exercised), or **tracked** (already recorded in the project's own known-issues table).

### F1 — The shipped engine predates the `response_time_std` contract fix — MEDIUM, latent→active on export

**New finding.**

`b_session_aggregate_results.response_time_std_ms` is a real, persisted column
([persistence_models.py:596](backend/app/infrastructure/persistence_models.py#L596)), written once
per completed session and never updated or deleted.

The shipped wheel computes it with the **pre-fix** code:

```python
# upadya_component_b_live_engine-0.1.0+be3.0e86fdc → component_b_generator/aggregation/session.py:141
std = _population_std(rts, mean)
```

`_population_std` divides by `len(values)`, so with exactly **one** non-timeout response — or with
several identical response times — it returns **`0.0`**, and `0.0` is persisted.

The research repository already decided this is wrong and fixed it in `e41b641`:

```python
# Yass/Implementation_v1.0/component_b_generator/aggregation/session.py
std = _population_std(rts, mean) if len(rts) >= 2 else None
if std == 0.0:
    std = None
```

with the reasoning recorded in-line: the B→3 contract field `b_item_response_time_std_sec` is
`PositiveTiming | None` (`gt=0.0`), so `0.0` is *rejected* by the contract — "no usable evidence"
must be `None`, matching the existing all-timeout precedent.

**The write path is verified end-to-end, not inferred.** All four steps were read:

1. [session_completion.py:171](backend/app/application/session_completion.py#L171) maps a timeout
   first attempt to `first_attempt_error_pattern = "timeout_no_response"`.
2. The wheel's `_response_time_stats` builds `rts` by filtering out exactly that pattern — so four
   timeouts and one response leave **one** sample.
3. [session_completion.py:471](backend/app/application/session_completion.py#L471) calls
   `adapter.aggregate_session(...)`, which delegates to the packaged (pre-fix) `aggregation.session`.
4. [session_completion.py:498](backend/app/application/session_completion.py#L498) writes
   `response_time_std_ms=stats.response_time_std_ms` into the persisted row.

**Why this matters, precisely.** The live backend is **not** violating its own schema today: the
column is a nullable `Float` with no positivity constraint, so `0.0` is legal where it is written.
The defect is **semantic**, and it becomes a contract violation at the boundary this system exists
to feed: `0.0` records *"measured zero variability"* where the truth is *"insufficient evidence to
measure variability."* Any downstream consumer computing over response-time dispersion will treat
a one-observation session as a perfectly consistent responder.

This is **not a rare edge case.** `MAX_OPPORTUNITIES_PER_SESSION` is 5, so a session with four
timeouts and one response — which yields exactly one `rts` entry — is an ordinary outcome,
especially for the dyscalculia cohort this system targets.

**This is a pinning-lag defect, not undiscovered drift.** The provenance manifest already records
it explicitly and honestly:

> "The Yass working tree HEAD (648762a…) had DRIFTED from the pinned commit in
> `component_b_generator/aggregation/session.py` (a 2026 change to response-time-std handling for
> <2 timed responses…). This package was built from the exact pinned-commit blob content via
> `git show <commit>:<path>`, not from the mutable working tree, so the drift does not affect this
> package."
> — [component-b-live-engine-manifest.json:25](backend/provenance/component-b-live-engine-manifest.json#L25)

That reasoning is correct **as a build-integrity statement** — the wheel faithfully represents
commit `0e86fdc`. But it resolves the wrong question. Build fidelity was preserved; the *fix* was
not shipped. The manifest's phrase "does not affect this package" is true of the package's
provenance and false of its behaviour.

**Resolution is a wheel rebuild, not a code change** — the fix already exists upstream. Per
Overview §7, that means rebuilding, recomputing the hash, and updating all pinned locations
together.

### F2 — Timeout discards the learner's submission irreversibly — HIGH, tracked (Known Issue 2)

**Confirmed as documented. Not a new finding.**

[attempt_submission.py:213-219](backend/app/application/attempt_submission.py#L213-L219):

```python
is_timeout = now >= opportunity.timeout_deadline_utc
response_matched: bool | None = None
submitted_value: str | None = None
event_kind = "TIMEOUT" if is_timeout else "RESPONSE"
if not is_timeout:
    ...  # only here is submitted_value populated and compared
```

On timeout the submitted value is never read, never compared, and never persisted —
`submitted_value` and `response_matched` are written as `NULL`.

**Research blast radius.** Two distinct losses compound:

1. **Irreversible data destruction.** The child's actual answer is gone the moment the request
   completes. No later fix can recover it. The Overview correctly identifies irreversibility as the
   critical property — every session run before this lands is permanently degraded.
2. **A late-but-correct answer is scored as an incorrect first attempt.** The generator's own
   FROZEN §6.10 timeout contract treats a timeout as an observed *incorrect* first attempt, so this
   feeds BKT as `correct=False`. A child who knew the answer but was slow is recorded as not
   knowing it — precisely the confound most damaging to a dyscalculia study, where slow-but-correct
   responding is a signal of interest rather than noise.

The taxonomy contradiction the Overview notes is real: the label is `timeout_no_response`, but a
submission demonstrably occurred.

Correctly assessed in the Overview as requiring a category split (late response vs true
non-response), which is a measurement-semantics decision, not a code tidy-up.

### F3 — The wheel installs a top-level `models` package into site-packages — LOW, latent

**New finding.**

`upadya_component_b_live_engine`'s `top_level.txt` declares **two** packages:

```
component_b_generator
models
```

`models/contracts.py` is installed at the **top level** of site-packages because the vendored code
imports it absolutely (`from models.contracts import SKILLS`, in 8 modules including
`aggregation/session.py`, `bkt/config.py`, `bkt/state.py`, `sequencing/score.py`).

`models` is an extremely generic top-level name. Any current or future dependency that installs a
top-level `models` package will collide, and the failure mode is a silent wrong-import of the
frozen 7-skill `SKILLS` tuple rather than a clean `ImportError`. There is **no collision today** —
the application layer uses `app.domain.*`, not top-level `models` — so this is latent, not active.

Worth recording because the whole architecture depends on the vendored package being the
authoritative source of `SKILLS`, and this is the one namespace where that could be silently
subverted.

### F4 — Fix identifiers in the Overview do not match the identifiers in the code — LOW, documentation

**New finding.** Traceability defect only; both fixes are genuinely present and correct.

| Fix | Overview label | Label in code |
|---|---|---|
| Numeric choice ordering | **BE-P1** (§5, §8 row 1) | **BE-C2 Part A** ([presentation.py:101](backend/app/domain/live_engine/presentation.py#L101)) |
| Sequencing spacing wiring | **BE-S1** (§4, §8 row 6) | **BE-P2** ([opportunity_selection.py:211,364](backend/app/application/opportunity_selection.py#L211)) |

An auditor grepping the codebase for `BE-P1` or `BE-S1` to verify the two most significant defect
fixes in the project's history will find nothing. Note also that the labels appear *transposed* in
form (`BE-P1`↔`BE-P2`), which makes accidental mis-citation more likely, not less.

### F5 — The Overview does not mention the aggregation drift its own manifest records — LOW, documentation

**New finding.**

Overview §7 explains the wheel-pinning mechanism well, and uses `B-NS07` as its worked example of
a fix that is inert until the wheel is rebuilt. It does not mention that a **second** item is in
the same state — and unlike `B-NS07`, that one silently affects persisted measurement data (F1)
rather than a visual. A reader of §7 comes away believing the rendering fix is the only thing
behind the pin.

The information exists in `component-b-live-engine-manifest.json`; it has simply not been
surfaced into the document that presents itself as "a table of currently known issues with their
real status."

**Recommendation:** add F1 as a seventh row to the §8 known-issues table.

### F6 — Two different science anchors are cited, never reconciled — INFORMATIONAL

The system cites **two** distinct `Yass` commits as the provenance of its science:

- `0e86fdcbc0ffcdbda3d37c742e83b1d532910e2b` — the wheel's pinned build commit
  (manifest, wheel version string, `requirements.lock`, bundle fixture).
- `73acb113bbb179f5946333c27b0142c43f3063f3` — `generator_git_tree_sha1` in
  `component-b-characterization.json`, the anchor behind `private_output_sha256`.

**This is not a contradiction.** They serve different scopes: the characterization file records an
offline B1 smoke run; the manifest records the live-engine build. `tests/test_be4f_parity.py`
already documents at length that the characterization anchor is *architecturally unreproducible*
through the adapter, because reproducing it requires `pipeline`/`cohort`/`behaviour.attempt_loop`
— exactly the modules the reuse boundary exists to exclude.

Recorded only because no single document states that the system has two anchors for two purposes,
which invites a reader to assume one supersedes the other.

Related, and to the project's credit: the manifest openly declines to assert a hash it could not
reproduce, rather than quietly asserting it —

> "This batch did not reproduce that exact algorithm (its precise path/newline/sort convention is
> not recorded anywhere in the repository) and does not assert equality with it."

### F7 — The hint-count clamp is lossy in principle, benign in current fact — INFORMATIONAL

**New observation.** Recorded so it is not rediscovered later as a surprise.

[session_completion.py:182](backend/app/application/session_completion.py#L182):

```python
# Engineering compatibility clamp: our system allows up to 3 hints independent of attempt
# count, but the reviewed package invariant assumes at most one hint per attempt.
hint_count = min(raw_hint_count, total_attempts)
```

This is the live-backend counterpart of the `DF-02` contract violation the research repo fixed by
adding `hint_bearing_opportunities`. Here the mismatch is absorbed by clamping instead.

**The clamp is genuinely benign today, and the in-code comment is accurate.** It only ever reduces,
never inflates; the raw hint events remain intact in `b_hint_events`; and neither persisted field
derived from it is sensitive to the reduction — `assisted_opportunity_count` is
`hint_bearing_opportunities` (a count of opportunities with ≥1 hint, unchanged by clamping 3→1),
and `hint_requested = hint_count > 0` cannot flip while `total_attempts ≥ 1`. **No persisted column
sums per-opportunity hint counts**, which is the only thing that would expose the loss.

Flagged because that safety is incidental rather than designed. If any future aggregate, export, or
B→3 adapter sums `hint_count`, it will silently under-report assistance — and hint dependence is a
primary measure of interest for a dyscalculia cohort, not an incidental statistic.

### Known-issue rows 3, 4, 5 — confirmed as documented

- **Row 3 (`B-NS07` conservation visual): BLOCKED, confirmed.** The `delta`-in-prompt fix is
  present in `packaging/` and **absent from the shipped wheel** — verified directly in the wheel's
  `samplers/number_sense.py`. Inert exactly as §7 describes.
- **Row 4 (8 templates missing visual scaffolds): open**, content-scope — not assessed here per the
  agreed scope.
- **Row 5 (expanded form accepts the bare numeral): confirmed open.**
  `_STRUCTURED_EQUIVALENCE_TEMPLATES` is `{B-PV02-DECOMPOSE-2D, B-PV04-DECOMPOSE-3D}`
  ([answers/registry.py:49](backend/packaging/component_b_internal/component_b_generator/answers/registry.py#L49)),
  and the bare numeral is the primary `correct_answer_raw` for these templates, so it matches
  before any equivalence set is consulted. Correctly characterised in the Overview as a scoring-
  policy question for Gate B — it changes what counts as a BKT observation — not a rendering fix.

---

## 3. The parity chain

### 3.1 Core science is byte-identical

A naive `diff` reports nearly every shared file as differing. **That is a CRLF/LF artifact and
should not be mistaken for drift.** Normalising line endings, only **9** files genuinely differ.

**Byte-identical**, including every module that computes a measurement:
`bkt/update.py`, `bkt/certification.py`, `bkt/guess_guard.py`, `bkt/state.py`, `bkt/config.py`,
`sequencing/score.py`, `sequencing/features.py`, `sequencing/config.py`, `sequencing/models.py`,
`answers/*`, `distractors/*`, `catalogue/loader.py`, and all samplers except `number_sense.py`.

The BKT math, the B-022 weighted sum, the correctness rules, and the distractor rules that run in
the live backend **are** the reviewed generator's, not a reimplementation. The architecture's
central claim holds.

### 3.2 The 9 genuine differences

All 9 are **deliberate live-safe subsetting**, and every one carries an in-file `PACKAGING NOTE`
naming its justification in `component-b-live-engine-reuse-map.json`.

| File | Nature |
|---|---|
| `behaviour/__init__.py` | Re-exports nothing; the pinned source eagerly imports 8 prohibited synthetic-generation modules that are **not shipped**. |
| `bkt/__init__.py`, `generation/__init__.py`, `models/__init__.py`, `sequencing/__init__.py` | Export-surface trimming to the reviewed live-safe closure. |
| `generation/task_instances.py` | `build_task_instance`/`generate_task_instances` byte-identical; removed `run_phase_b2a` and its `from ..runner import run_phase_b1` (the module-level reach into the prohibited pipeline). |
| `models/behaviour.py` | Retains only `BOpportunityResponseSummary` + constants; **removes `BLearnerSkillTruth`, `BAttemptEvent`, and all hidden-truth/trait models**. |
| `aggregation/session.py` | **F1** — packaging copy is *behind* research `main`. |
| `samplers/number_sense.py` | **KI-3** — packaging copy is *ahead* of research `main`; fix inert in the wheel. |

The `models/behaviour.py` and `behaviour/__init__.py` trims deserve explicit credit: hidden learner
truth and synthetic trait models are **physically absent from the shipped artifact**, not merely
unimported. A leak of simulation truth into live measurement is impossible by construction rather
than by discipline.

### 3.3 Three-way state, and what actually ships

| | RT-std `None` guard | `B-NS07` `delta` in prompt |
|---|---|---|
| Research `main` (`648762a`) | **present** | absent |
| Vendored `packaging/` | absent | **present** |
| **Shipped wheel** (`+be3.0e86fdc`) | **absent** | **absent** |

**Correction worth stating explicitly:** `provenance/wheels/` contains two wheels, and only
`upadya_component_b_live_engine` (be3) is installed — it is the sole wheel in `requirements.lock`
and the only one `COPY`d by the Dockerfile (`pip install --require-hashes --no-deps`). The
`upadya_component_b_generator-0.1.0+be0.0e86fdc` wheel is **not installed by any path examined**
and appears to be an unused artifact. All findings above were verified against the *installed*
wheel.

### 3.4 The hash chain verifies clean

Overview §7 claims the wheel is pinned by hash in three places. **Verified — all four agree:**

| Location | Value |
|---|---|
| `requirements.lock:883` | `faa5760d…a70c29` |
| `component-b-live-engine-manifest.json:13` | `faa5760d…a70c29` |
| `tests/fixtures/runtime_bundle/valid_unapproved_bundle.json` `generator.checksum` | `faa5760d…a70c29` |
| `sha256sum` of the wheel on disk | `faa5760d…a70c29` |

The checksum discipline described in §6 and §7 is real and currently consistent.

---

## 4. Confirmed correct

Reported because a findings-only review would misrepresent a system whose measurement path is, in
the main, carefully built.

**First-attempt-only BKT — sound, and defended in depth.** The gate is
`attempt_index == 1 and event_kind == "RESPONSE"`
([attempt_submission.py:269](backend/app/application/attempt_submission.py#L269)), backed by
**three independent layers**: a `SELECT … FOR UPDATE` row lock on the opportunity; and two database
constraints — `uq_b_skill_state_transitions_opportunity` and
`uq_b_skill_state_transitions_attempt`. A concurrent duplicate cannot double-count a BKT
observation; it loses on the unique index and is mapped to a 409. Retries and timeouts move no
mastery. `uq_b_attempts_opportunity_index` additionally prevents duplicate attempt indices.

**Hints cannot contaminate mastery — structurally.**
[hint_request.py](backend/app/application/hint_request.py) imports `HintEventRepository`,
`ItemOpportunityRepository`, `SessionRecordRepository`, and the idempotency/bundle repositories —
and **none** of `LearnerSkillStateRepository`, `AttemptRepository`, or
`SkillStateTransitionRepository`. There is no code path by which requesting a hint writes a
mastery observation. Hint level derivation takes the same opportunity row lock as the attempt path,
so L1→L2→L3 cannot be raced.

**The BE-S1/BE-P2 sequencing fix is genuinely wired.** `sessions_since_practice` is a real SQL
aggregation over the learner's prior sessions
([repositories.py:268](backend/app/infrastructure/repositories.py#L268)), computed at
[opportunity_selection.py:367](backend/app/application/opportunity_selection.py#L367) and passed
into scoring at :376. `spacing_due` is no longer a constant. The claimed fix is real — verified
against source, not taken from the build log.

**The BE-P1/BE-C2 choice-ordering fix is genuinely fixed, and fixed well.** Both call sites now
share **one** derivation, `derive_presented_choices`
([presentation.py:93](backend/app/domain/live_engine/presentation.py#L93)). It sorts numerically
only when *every* choice parses as an integer, falls back to lexicographic otherwise (preserving
`<`/`>`/`=`, `same`/`changed`, and comma-joined `ordered_list` strings), and tie-breaks
deterministically on the string. The predicate uses `int()` rather than `str.isdigit()` — a
correct choice, since `isdigit()` accepts exotic Unicode digit forms `int()` rejects and rejects
the leading `-` that `int()` accepts; predicate and sort key therefore agree exactly. The previous
duplicate-derivation drift risk is closed by construction and asserted by
`test_bec2_presented_choice_ordering.py`.

**The import boundary is real.** `test_be2_architecture_guards.py` walks the **AST** of every
`Path("app").rglob("*.py")` and permits `component_b_generator` (plus `yass`, `bkt`, `sequencing`,
`certification`) imports **only** from `app/infrastructure/live_engine/adapter.py`. AST-based, so
the textual mentions elsewhere in `app/` are comments and docstrings, not violations — confirmed by
inspection. `IMPORT_POLICY.md`'s rule is enforced, not merely asserted.

**Parameter authorization labelling is accurate — no mislabelling found.** Checked against
`component-b-scientific-parameter-authorization.json` rather than code comments, as instructed.
The BKT config is `authorization_status: UNRESOLVED` / `CALIBRATION_PENDING` in provenance and is
named `_ENGINEERING_BKT_CONFIG` and documented `TEST_FIXTURE_ONLY` in code. The B-022 sequencing
weights are the **sole** `authorization_status: FROZEN` entry, matching Overview §4's claim that
the formula is approved while everything around it is a placeholder. Nothing is described as
approved that the provenance records do not approve, and nothing approved is described as a
placeholder.

**The measurement/exposure boundary holds.** `b_session_aggregate_results` and
`b_skill_certification_results` are private tables, documented as never read by any public-DTO
projection, with column names deliberately avoiding `PROHIBITED_COLUMN_TERMS` (`skill_estimate`
not `mastery`/`p_l`, `threshold_met_flag` not `certified_flag`). No mastery probability or
certification decision reaches a learner-visible response. Overview §2.6's claim is accurate.

**`SF-039` (no population-conditioned runtime branching) holds vacuously.** No live path branches
on `population`/`dd_subtype`; those concepts have no representation in the live schema at all, and
the synthetic-truth models carrying them are absent from the shipped package (§3.2).

**`test_be4f_parity.py` is a model of honest testing.** It documents that the *preferred*
direct-digest verification is architecturally unavailable, explains precisely why (it would require
importing the very modules the reuse boundary excludes), records the searches performed to confirm
no reproduction script exists, and then runs the documented fallback. It should be read as evidence
of review quality, not as a weakened test — though it is worth noting what the fallback does not
cover: it establishes adapter/generator agreement on task construction, not end-to-end reproduction
of the characterization digest.

---

## 5. Recommendations

Ordered by research-data impact. **No change to any scientific parameter is proposed.**

1. **Rebuild and re-pin the wheel** to a commit containing `e41b641` (F1). The fix exists upstream;
   this is a packaging action, not a code change. Per Overview §7 this means rebuilding the wheel,
   recomputing its hash, and updating `requirements.lock`, the bundle fixture's
   `generator.checksum`, and the manifest **together**. This would also land the `B-NS07` `delta`
   fix (KI-3), provided the rebuild is taken from a tree containing both.
2. **Resolve the timeout category split** before any data-collecting run (F2). Persisting the
   submitted value and separating "late response" from "true non-response" cannot be applied
   retroactively — every session run beforehand is permanently degraded.
3. **Add F1 to the §8 known-issues table** and note in §7 that the wheel pin holds back a
   measurement fix as well as a rendering fix (F5).
4. **Reconcile the fix identifiers** between the Overview and the code (F4).
5. **Consider namespacing the top-level `models` package** at the next wheel rebuild (F3), or
   document the collision risk if the absolute import is load-bearing for parity.
6. **Remove or document `upadya_component_b_generator-…+be0…whl`**, which is present in
   `provenance/wheels/` but installed by nothing (§3.3).

---

## 6. Reproducing these findings

Static review; every finding is independently reproducible. Paths are relative to
`ResearchProject/`.

```bash
# Parity, line-endings normalised — the check that avoids the CRLF false alarm.
# Expect exactly 9 differing files.
R="Yass/Implementation_v1.0/component_b_generator"
L="Upadya/Dev/backend/packaging/component_b_internal/component_b_generator"
diff -rq --strip-trailing-cr --exclude=__pycache__ "$R" "$L"

# F1 — what actually ships. Expect the UNGUARDED one-liner.
cd Upadya/Dev/backend
unzip -o -q provenance/wheels/upadya_component_b_live_engine-0.1.0+be3.0e86fdc-py3-none-any.whl -d /tmp/whl
grep -n "_population_std(rts, mean)" /tmp/whl/component_b_generator/aggregation/session.py

# F1 — the fix that exists upstream but is not shipped.
git -C ../../Yass log --oneline 0e86fdc..HEAD -- Implementation_v1.0/component_b_generator
#   -> e41b641  b_item_response_time_std_sec None for <2 timed responses / zero variance

# KI-3 — delta absent from the shipped prompt (present only in operands).
sed -n '68,74p' /tmp/whl/component_b_generator/samplers/number_sense.py

# F3 — two top-level packages installed.
cat /tmp/whl/upadya_component_b_live_engine-0.1.0+be3.0e86fdc.dist-info/top_level.txt

# §3.4 — hash chain agreement (all four should print faa5760d…a70c29).
sha256sum provenance/wheels/upadya_component_b_live_engine-*.whl
grep -A1 "upadya_component_b_live_engine" requirements.lock
grep '"wheel_sha256"' provenance/component-b-live-engine-manifest.json
grep -A3 '"source_identifier"' tests/fixtures/runtime_bundle/valid_unapproved_bundle.json
```

---

## 7. Limits of this review

Stated so the verdict is not read as covering more than it does.

- **Coverage within `Dev/backend/` was targeted, not exhaustive.** Read in full or in the relevant
  part: `attempt_submission.py`, `session_completion.py` (aggregate/certification write path),
  `persistence_models.py`, `repositories.py`, `presentation.py`, `test_be2_architecture_guards.py`,
  `test_be4f_parity.py`. Read only in part: `adapter.py` (`aggregate_session` and the boundary
  surface; the other ~600 lines were not line-audited), `opportunity_selection.py` (the sequencing
  wiring), `hint_request.py` (its import surface, which is what the contamination claim rests on).
  Not reviewed: the API route layer, `unit_of_work.py`, `auth.py`, migrations.
- **The research generator was used as a reference, not reviewed as a subject.**
  `Yass/Implementation_v1.0/component_b_generator/` was diffed file-by-file against the vendored
  copy and read where a diff required explanation. Its own logic was **not** independently
  audited — in particular `generation/`, `pipeline.py`, `pilot.py`, `audits/` (the SF-038 leakage
  gate), `cohort/`, and `adapters/to_3.py` (the B→3 export) were not reviewed. The
  `shared_orchestrator/` was not examined at all. A measurement-integrity review of the *dataset
  generation* path is separate work and has not been done here.
- **No code was executed.** The claimed-green suites — the backend's own tests and the research
  repo's 893 — were **read, not run**. Their existence and assertions were inspected; their passing
  status is taken from project records, not verified here. Closing that is a follow-up
  (`pytest` in `Dev/backend`; `PYTHONPATH=. python -m pytest -q` in `Yass/Implementation_v1.0/`).
- **Scope was measurement integrity and doc-vs-code parity.** No general security review was
  performed: authentication, authorization, cross-learner and cross-classroom tenancy isolation,
  presentation-token handling, and input validation were **not** systematically audited. Answer-
  leakage was confirmed only at the aggregate/certification boundary (§4), not exhaustively across
  every DTO.
- **Content and age-appropriateness were not assessed**, including Known Issue 4's missing visual
  scaffolds.
- **Scientific validity is entirely out of scope.** Whether the BKT model, the certification
  threshold, or the B-022 weights are *right* is a Gate B question. This review checked only that
  what the code does matches what the documents and provenance records say it does.
