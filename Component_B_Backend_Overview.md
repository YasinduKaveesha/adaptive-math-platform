# Component B — Backend Overview

**Purpose of this document:** a complete, accurate map of what the Component B backend is, how a question actually gets from the database to a child's screen, what governs correctness, and what is currently known to be incomplete or wrong. Written for review — every claim below is grounded in the actual source at `backend/`, not summarized from memory.

**Standing constraint that applies to everything in this document:** Gate B is unresolved. Every scientific parameter described below (BKT config, certification threshold, sequencing weights' *initial values*, timeout duration) is either a TEST-fixture engineering placeholder or, in one case (sequencing weights), an approved-but-not-yet-clinically-validated value. **No real child may use this system.** All data described here is TEST-provenance only.

---

## 1. The three layers, and why they're separated

```
backend/app/                          ← "the application" — owns HTTP, auth, persistence, orchestration
backend/packaging/component_b_internal/component_b_generator/   ← "the science" — vendored package
provenance/wheels/*.whl                ← what actually ships (see §7 — this matters)
```

**`app/`** never computes a correct answer, never runs BKT math, never decides what a distractor looks like. It is the only thing an HTTP request touches. Its job is: authenticate, authorize, persist, and call into the science package through one narrow interface (`app/infrastructure/live_engine/adapter.py`).

**`component_b_generator`** is the reviewed scientific package — item generation, correctness rules, distractor generation, BKT, sequencing, certification, hints. It is written to be usable standalone (it has its own generation pipeline for producing offline datasets) and is *reused*, not reimplemented, by the live backend.

**The adapter (`app/infrastructure/live_engine/adapter.py`)** is the only file allowed to import from `component_b_generator`. Every scientific operation the backend performs goes through one of its methods. This is enforced by an architecture guard test (`test_be2_architecture_guards.py`) that fails the build if any other file under `app/` imports the package directly.

Why this separation exists: it's the mechanism that lets the project claim "the live system uses the exact same scientific code that was reviewed for the offline dataset generator" — a parity claim, not a reimplementation.

---

## 2. The learner's actual journey through the system

### 2.1 Identity and classroom (no science involved)

```
POST /api/v1/learner/profile          → app/api/routes/profile_classroom.py
POST /api/v1/classroom-invites/resolve
POST /api/v1/classroom-memberships/requests
POST /api/v1/classroom-memberships/{id}/approve   (teacher action)
```

A learner signs up (real Supabase auth), creates a profile, and joins a classroom via a teacher-issued code. **`Learner.grade` is assigned only at approval** (`app/application/classroom_membership.py`) — this was a real bug fixed early in this project's history (BE-G1): before that fix, grade was never set anywhere, and every subsequent question request failed with 409 forever.

There is currently no teacher application — a backend-only script (`backend/scripts/dev_fixture_learner.py`) drives this whole chain over real HTTP as a stand-in, so the learner-side app can be built and tested without a teacher UI existing yet.

### 2.2 Starting a session

```
POST /api/v1/b/sessions               → app/application/b_session_lifecycle.py
```

Idempotent by *learner state*, not just by key: if the learner already has a starting-or-active session, this endpoint returns it — it never 409s on retry. A session pins one `RuntimeBundleRecord` (§6) for its entire lifetime.

### 2.3 Getting a question

```
POST /api/v1/b/sessions/{id}/opportunities   → app/application/opportunity_selection.py
```

This is the most scientifically involved endpoint in the system. In order:

1. **Resolve the pinned catalogue + bundle** (§6).
2. **Build every eligible candidate** — every item template whose `grade_scope` matches the learner's grade.
3. **Score each candidate** via the sequencing formula (§4).
4. **Pick the winner**, deterministically tie-broken.
5. **Sample real operands** for that template (e.g. actual numbers for an addition problem) via `component_b_generator.samplers`.
6. **Compute the correct answer and distractors** (§5).
7. **Persist an `ItemOpportunityRecord`** (state `OPEN`) and a `TaskInstanceRecord` (the private row holding the correct answer — never sent to the client).
8. **Return the safe, public `OpportunityPresentationResponse`** — stem, response format, presented choices, a presentation token, and the timeout deadline. **The correct answer never appears in this response, structurally** — it's built via an explicit allow-list DTO (`app/domain/b_opportunity.py`), not by stripping fields off a private object.

**Recovery path, no idempotency key:** calling this endpoint again while an opportunity is still `OPEN` re-issues the *same* opportunity with a fresh presentation token, rather than creating a new one. This is what lets the frontend recover from a crash or a lost network response without duplicating a question.

### 2.4 Submitting an answer

```
POST /api/v1/b/sessions/{id}/opportunities/{oppId}/responses   → app/application/attempt_submission.py
```

The server, not the client, decides correctness — via `adapter.answers_equivalent(submitted, correct)`. Two paths:

- **`RESPONSE`** — submitted before the deadline. Compared for real.
- **`TIMEOUT`** — submitted at or after `opportunity.timeout_deadline_utc`. **The submitted value is persisted but still never compared** (`BF-2`, see §8 Known Issue 2 — the value used to be discarded outright; that data-loss defect is fixed, but comparing a late answer for correctness remains a deliberate Gate B governance decision, not something this fix resolves).

**First-attempt-only BKT.** Mastery only updates on `attempt_index == 1` and `event_kind == "RESPONSE"`. Retries never move mastery. This is enforced at the database level by a unique constraint on `(opportunity, first-attempt)`, not just application logic — a concurrent duplicate loses the race and gets a 409, not a double-counted observation.

### 2.5 Hints

```
POST /api/v1/b/sessions/{id}/opportunities/{oppId}/assists   → app/application/hint_request.py
```

Strictly governed: L1 → L2 → L3, single-step, server-derived from a count of prior hint events under the same row lock the attempt path uses (so a concurrent request can't race past L3). **A hint request is never a mastery observation** — hints live in a completely separate table (`b_hint_events`) from attempts, and this module never imports the mastery-write repository.

Every hint's text comes from the catalogue and is never generated: "no LLM, no paraphrase, no generic fallback" is enforced by construction — a missing or blank hint fails closed (409), it does not synthesize a plausible-sounding substitute.

### 2.6 Advancing / completing

```
POST /api/v1/b/sessions/{id}/opportunities/{oppId}/complete   → app/application/session_completion.py
```

Requires at least one recorded attempt for that opportunity (fail-closed 409 otherwise — "complete on command" needs something to complete). Closes the current opportunity, then either opens the next one inline (in the same response, no second round trip) or marks the session `completed` once `MAX_OPPORTUNITIES_PER_SESSION` (currently 5 — an engineering placeholder, not a governed session length) is reached.

At session completion, `aggregate_session` (the adapter, calling into the package) computes first-attempt accuracy, retry counts, response-time statistics, per-skill estimated mastery, and — via `certify_skill`, gated by the Guess-Guard's plausibility check (`evaluate_guess_guard`, comparing this session's own median response time against a floor derived from the learner's *prior* sessions — see §8 Known Issue 8 for a real wiring defect here, now fixed as `BF-1`) — a certification decision. **None of this is exposed to the client.** The public completion DTO carries only `opportunities_completed` / `opportunities_total_bound` / `session_state`. No raw mastery probability, no certification result, no per-skill breakdown ever crosses into a response a learner or their device can see. This is a deliberate, architecturally-enforced boundary — "safe progress" — and it is currently the correct behavior *regardless* of Gate B, since exposing any of it would be presenting an unapproved measurement as fact to a child or parent.

---

## 3. The nine response formats, and what the client is allowed to do with each

Every item template declares one `response_format`. Measured directly from the 29 samplers currently shipped:

| Format | Count | Shape |
|---|---|---|
| `single_integer_or_choice` | 17 | 4 choices, pick one |
| `single_integer` | 2 | 4 choices, pick one |
| `single_choice_or_integer` | 2 | 4 choices, pick one |
| `relation_choice` | 2 | 3 choices (`<` `>` `=`) |
| `expanded_form` | 2 | typed answer |
| `single_choice` | 1 | 4 choices |
| `ordered_list` | 1 | 4 choices, each a whole pre-ordered sequence |
| `interactive_set_selection` | 1 | child builds a set, surface yields a count |
| `binary_or_choice` | 1 | 2 choices |

**The client never constructs an answer.** For every choice-based format, `presented_choices` arrives from the server and the client relays the exact string the child picked — verbatim, no reformatting, no reordering (see §8, Known Issue 1 — the sort was recently fixed but is worth knowing the client itself never had permission to fix it). For `ordered_list` specifically: the server has already pre-joined a whole candidate ordering into one string (e.g. `"12,45,300"`); the child picks one of those complete strings. The client does not assemble an ordering from parts.

---

## 4. Sequencing — how the "next question" is chosen

**Formula (approved, not a placeholder — catalogue revision B-022):**

```
score(item) = 0.50 · mastery_gap + 0.30 · prerequisite_readiness + 0.20 · spacing_due
```

- `mastery_gap` = `1 − estimated_mastery` for that skill (BKT `p_l`, or the skill's prior if never attempted).
- `prerequisite_readiness` = mean mastery across the skill's prerequisite skills (`1.0` if none — a soft signal, never a hard gate).
- `spacing_due` = how many sessions have passed since the learner last practiced this skill, saturating at `1.0` after 4 sessions; `1.0` if never practiced.

Highest score wins; ties break deterministically (skill order, then item id) — never randomly.

**This formula had a real bug, now fixed (2026-07-30, `BE-P2` in the code — previously referred to in this document and in `buildLog1.md` as `BE-S1`; both names are the same fix, `BE-P2` is what a `grep` of the codebase actually finds).** The code that supplied practice history to `spacing_due` was rebuilding an empty, always-`None` mapping on every single call — meaning every candidate scored the ceiling on spacing, forever, regardless of how many times it had just been played. The approved 20% spacing term was silently a constant. The fix (`ItemOpportunityRepository.sessions_since_practice`, wired through `opportunity_selection.py:211,364`) supplies real per-skill history from the database; the 0.50/0.30/0.20 weights and every other formula input were untouched — this was a wiring defect, not a science change. Verified before/after: template diversity in live play rose from ~2 distinct templates in 40 selections to 5, with no other change to responder behavior.

**What is still an open question, correctly not resolved by that fix:** whether a learner who keeps answering a skill incorrectly *should* keep being served that skill (because `mastery_gap` stays high) is a live product/research decision, not a bug. The fix restored the formula's intended balance; it did not add any new policy like a repetition cap.

---

## 5. Correctness and distractors

**Correctness.** `component_b_generator.answers.rules.answers_equivalent(a, b)` — both sides normalized (`normalize_answer`: strips whitespace, strips leading zeros/sign on integers, comma-joins ordered answers) then compared for equality. For two templates (`B-PV02`, `B-PV04` — "write N in expanded form"), a small set of pre-generated equivalent forms is also accepted (e.g. `"123"` also accepts `"100 + 20 + 3"` and `"1 hundreds + 2 tens + 3 ones"`).

**Distractors.** Generated per-template by a fixed rule (e.g. ±1/±2 for counting, wrong-place-value digits for place-value templates), then normalized, deduplicated against the correct answer and its equivalents, and — if a required count still isn't met — topped up with generic off-by-k integer fillers. If the required count genuinely can't be met, generation **raises rather than serving fewer distractors than specified.**

**Ordering (fixed 2026-07-30, `BE-C2 Part A` in the code — previously referred to in this document and in `buildLog1.md` as `BE-P1`; same fix, `BE-C2 Part A` is what a `grep` of the codebase actually finds, at `presentation.py:101`).** Choices used to be sorted as strings, so `10, 11, 9` was a real, observed on-screen defect. Now: sorted numerically whenever every choice parses as an integer, falling back to the original lexicographic sort otherwise (for `<`/`>`/`=`, `same`/`changed`, etc.). Measured before/after on real generator output: 14.5% of Grade 2 and 23.8% of Grade 3 numeric items were out of order before the fix; 0.0% after, across both grades.

---

## 6. Catalogue and runtime bundle

Every item template's full definition — grade scope, task type, correct-answer rule, distractor rule, and **all three levels of hint text** — lives in one governed markdown file. In the live backend today, the bundle actually served is a **TEST-fixture bundle** (`be3b-test-fixture-1.0`), whose catalogue and bundle-manifest checksums are pinned to a specific fixture file (`tests/fixtures/runtime_bundle/test_catalogue.md`), not the full authoritative research catalogue.

**Hint coverage was recently corrected (BE-C1).** The fixture catalogue originally had governed hint text for only 2 of 36 templates; the other 34 would 409 on any hint request. All 36 × 3 hint levels have since been ported verbatim from the authoritative source — independently verified field-by-field, 108/108 matching, zero mismatches.

**A checksum discipline runs through this whole system**, and it matters for anyone editing these files: the bundle fixture pins the catalogue file's SHA-256. Edit the catalogue without recomputing that hash in the bundle (and every other file that repeats it), and every question request will start failing readiness/selection checks with a 409 that gives no indication the cause was a stale hash.

---

## 7. A structural fact that will surprise anyone editing the science package

`component_b_generator` (the folder under `packaging/`) is **not what actually runs in the container.** The Docker build never copies `packaging/` at all — it installs a **pre-built wheel**, pinned by hash, in three places at once (`requirements.lock`, the bundle fixture's `generator.checksum`, and `provenance/component-b-live-engine-manifest.json`).

**Practical consequence:** an edit to any file under `packaging/component_b_internal/component_b_generator/` has **zero runtime effect**, even after a full container rebuild, until someone deliberately rebuilds the wheel, recomputes its hash, and updates all three pinned locations together. This has already caused **two** real instances of a "fix" that looked correct in source but did nothing in the running system — not just one. The `B-NS07` conservation template still can't show its picture, because the fix to send its magnitude to the client is sitting in `packaging/`, inert, waiting on exactly this rebuild. Less visibly, the shipped wheel's `aggregation/session.py` also predates an upstream fix to `response_time_std_ms` (Known Issue 7, below) — a session with a single non-timeout response persists a standard deviation of `0.0` instead of `None`, silently claiming "measured zero variability" where the truth is "insufficient evidence to measure it." Both are held back by the same pin; a reader who only checks the rendering case can easily miss that a measurement fix is queued up behind it too.

This pinning exists on purpose — it's what makes "the running engine matches what was reviewed" a checkable claim rather than an assertion — but it means **verifying a science-package change requires checking which artifact actually ships it**, not just rebuilding the container.

---

## 8. Known issues — current state, as of this document

| # | Issue | Status |
|---|---|---|
| 1 | Choices displayed in string-sort order (`10, 11, 9`) | **Fixed** (`BE-C2 Part A`, `presentation.py:101` — formerly called `BE-P1` in this document). Verified live and at the generator, both grades, 0% out-of-order after fix. |
| 2 | A late-but-correct answer was discarded and recorded as `timeout_no_response`, contradicting the taxonomy's own definition of that label (which requires *no* submission) | **Fixed** (`BF-2`, `attempt_submission.py`). The submitted value is now persisted on the `TIMEOUT` path — `response_matched` still stays `NULL` and `event_kind` still stays `"TIMEOUT"`, so no scoring semantics changed; this was pure data preservation. Required a companion migration (`20260801_0001`) to relax a database `CHECK` constraint that had encoded the old, discard-on-timeout behavior at the schema level, not just in application code. The taxonomy split this issue also implies (separating "late response" from "true non-response") remains a deliberate Gate B governance decision, not resolved by this fix. |
| 3 | `B-NS07` (conservation / "same or changed") can't show its before/after picture | **Blocked**, not broken — see §7. Fix is written, inert until the wheel is rebuilt. |
| 4 | 8 answerable templates are missing their catalogue-specified visual scaffold (number line, groups, array, sharing, number cards, column-algorithm layout) | **Open**, lower priority — these questions work, they just lack the concrete representation the design calls for. |
| 5 | *"Write 52 in expanded form"* accepts the bare numeral `52` as fully correct | **Open, flagged for Gate B** — this is a scoring-policy question (it changes what counts as a BKT observation), not a rendering fix. |
| 6 | Sequencing served the same 1–2 templates for dozens of selections in a row | **Fixed** (`BE-P2`, `opportunity_selection.py:211,364` — formerly called `BE-S1` in this document) — was a genuine wiring defect (spacing signal was inert), not the approved formula misbehaving. Verified live: template diversity rose from 2 to 5 distinct templates with no other change. |
| 7 | A session with a single non-timeout response (or several identical response times) persists `response_time_std_ms = 0.0` instead of `NULL` — the B→3 contract's `PositiveTiming \| None` (`gt=0.0`) rejects `0.0`, so this claims "measured zero variability" where the truth is "insufficient evidence" | **Blocked on wheel rebuild** (`BF-4`) — the fix exists upstream in the research repo (commit `e41b641`) but the shipped wheel predates it; see §7. `BF-3`'s estimator-parity test (`test_bf_estimator_parity.py`) encodes the expected post-fix behavior as an `xfail` that will flip to a hard failure (`strict=True`) the moment the rebuild lands, so this cannot be silently forgotten. |
| 8 | The Guess-Guard's plausibility floor and a session's own median response time were computed from the identical current-session-only sample, making the `TRIGGERED` outcome mathematically unreachable for any input — not merely rare | **Fixed** (`BF-1`, `session_completion.py` + new `ItemOpportunityRepository.prior_session_first_attempt_rts`). The floor now comes from the learner's prior sessions, matching the reviewed package's own reference sequencing; the current session's own data still supplies only its own median, never its own floor. No BKT parameter, weight, or threshold changed — this was purely a wiring defect, proven by a hand-derived quantile-monotonicity argument (`floor(q=0.1) ≤ median(q=0.5)` on one identical sample, always) before any code was touched. Verified with a real learner reaching `TRIGGERED` through the full integration path (`test_be4e_session_completion.py`) and at the estimator level with hand-computed expected values (`test_bf_estimator_parity.py`). |

---

## 9. Regarding the screenshot under review — Number Sense, "3 of 5"

The specific question in the screenshot provided alongside this document:

- Stem: *"Which numeral matches the quantity?"*
- Visual: 5 clearly-separated dots, correctly rendered (this is the `B-NS02-QUANTITY-NUMERAL` template, whose visual rendering was itself a fix landed earlier this project — FE-3g)
- Choices: `3, 4, 5, 6` — four options, numerically ordered, one increment apart
- Answer given: `5`, marked correct, "Nice work!" shown

**This is not evidence of an over-hard Number Sense question** — by every visible signal (small quantity, well-separated dots, four sequential single-digit choices, correctly answered) this is a well-calibrated, easy item for the stated grade. If a *different* Number Sense question felt too hard, it would help to know which one specifically — the template, the numbers shown, and what made it feel hard (the number size, the wording, the number of choices, something else) — since Number Sense actually spans a wide difficulty range: this template (`B-NS02`) sits at difficulty `L1`, while others in the same skill category (e.g. `B-NS05-ORDER-NUMBERS`, ordering three numbers up to 999) are meaningfully harder and eligible for Grade 3 as well as Grade 2.
