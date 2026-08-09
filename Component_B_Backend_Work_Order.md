# Component B Backend — Work Order

**Status:** ready to execute. **Owner:** backend agent.
**Companion review documents** (read both, in this order):
1. `Component_B_Backend_Overview.md` — orientation (unchanged; still the best map of the system)
2. `Component_B_Measurement_And_Parity_Review.md` — parity + measurement-integrity review
3. *(optional, cross-repo)* `Yass/Component_B_Statistical_Review_Backend_and_Generator.md` — the
   statistical review both repos share. **Everything backend-relevant from it is reproduced in
   this file**, so you do not need access to the `Yass` repo to do this work.

---

## 0. Read this first — the two-repo structure

Component B is **two codebases**:

- **This repo (`Upadya/Dev/`)** — the live backend. `app/` owns HTTP, auth, persistence,
  orchestration. It computes **no** science.
- **`Yass/Implementation_v1.0/component_b_generator/`** — the research dataset generator. It owns
  the science. The backend reuses it as a **pre-built wheel pinned by hash**.

**Three traps, all of which have bitten this project before:**

1. **Editing `backend/packaging/.../component_b_generator/` has ZERO runtime effect.** The Docker
   build never copies `packaging/`. It installs `provenance/wheels/upadya_component_b_live_engine-*.whl`.
   A change there is inert until the wheel is rebuilt and re-pinned in three places.
2. **A naive `diff` against the research repo is meaningless** — it reports near-total difference
   that is purely CRLF vs LF. Always use `diff --strip-trailing-cr`.
3. **`provenance/wheels/` contains two wheels; only `live_engine` is installed.** The
   `upadya_component_b_generator-*.whl` is unused. Verify against the installed one.

**Division of labour for this round:** you take the backend (`app/`, `tests/`, docs in this repo).
The **generator changes are owned by the supervising agent** in the `Yass` repo — do not edit
`packaging/` or attempt generator fixes.

---

## 1. Hard constraints

- **Do not change any scientific parameter value.** Not `theta_b`, not `floor_quantile` (0.1), not
  `floor_min_obs` (5), not the BKT priors, not the B-022 sequencing weights (0.50/0.30/0.20), not
  `MAX_OPPORTUNITIES_PER_SESSION`. These are either approved research values or explicitly gated
  placeholders; changing one is a governance decision, not a code change. **Every fix below is a
  wiring or persistence change that leaves all parameter values exactly as they are.**
- **Do not change scoring semantics.** No fix below may alter what counts as a BKT observation.
  Where that boundary is close (BF-2), the work order stops deliberately short and says so.
- **Gate B is unresolved. No real child may use this system.** All data is TEST-provenance.
- **If code and a document disagree, trust the code and report the discrepancy** rather than
  editing code to match prose.
- Keep the existing style: these modules carry unusually detailed "why" docstrings that record
  reasoning and rejected alternatives. Match that. A one-line comment where the surrounding code
  explains its reasoning in a paragraph is a regression.

---

## 2. BF-1 — Fix the guess-guard wiring — **CRITICAL**

### The defect

`app/application/session_completion.py:452-469`:

```python
rt_history = [                                     # <-- THIS SESSION's responses only
    o.first_attempt_response_time_ms / 1000.0
    for o in by_skill.get(skill_id, ())
    if o.first_attempt_error_pattern != "timeout_no_response" and o.first_attempt_response_time_ms > 0
]
median_rt_sec = adapter.plausibility_floor(rt_history, _MEDIAN_QUANTILE, _MEDIAN_MIN_OBSERVATIONS)
guard_statuses[skill_id] = adapter.evaluate(
    skill_estimate,
    median_rt_sec,      # q = 0.50 of this session's sample
    rt_history,         # floor = q = 0.10 of THE SAME SAMPLE
    theta_b, _ENGINEERING_BKT_CONFIG.floor_quantile, _ENGINEERING_BKT_CONFIG.floor_min_obs,
)
```

with `_MEDIAN_QUANTILE = 0.5`, `_MEDIAN_MIN_OBSERVATIONS = 1` (lines 130-131), and
`floor_quantile = 0.1`, `floor_min_obs = 5` (`opportunity_selection.py:126-127`).

**Two independent defects, either of which alone disables the guard:**

**(a) It is mathematically incapable of triggering.** The floor and the median come from *the same
sample* via the same type-7 quantile function, which is monotonically non-decreasing in `q`:

```
floor = quantile(S, 0.10)  ≤  quantile(S, 0.50) = median
```

The trigger condition is `median < floor`, which is therefore **false for every possible input**.
`TRIGGERED` is unreachable — the guard can only return `NOT_TRIGGERED` or `INSUFFICIENT_EVIDENCE`.

**(b) There is no cross-session RT history.** Only the current session's responses are passed. With
`MAX_OPPORTUNITIES_PER_SESSION = 5` spread across skills (and deliberately diversified by the
BE-P2 sequencing fix), one skill will rarely reach `n_min = 5` non-timeout observations in a single
session, so the floor is `None` and the status is `INSUFFICIENT_EVIDENCE` regardless.

### Why it matters

The guess-guard is not an optional refinement. It exists specifically to counter standard BKT's
documented failure mode (Agarwal et al.: `p(L)` remained 0.83 after three of four wrong answers).
It is the **only** mechanism preventing a fast-guessing learner from being certified as having
mastered a skill. In the backend it cannot perform that function under any input.

The reviewed package's `evaluate_guess_guard` is **correct** — do not touch it. This is purely a
matter of the backend calling it with the wrong arguments.

### The reference implementation — copy this behaviour

The generator does it correctly. Mirror this logic
(`Yass/Implementation_v1.0/component_b_generator/pipeline.py:236-250`):

```python
# Guess-Guard per practised skill: floor from history strictly BEFORE this session,
# evaluated against this session's own per-skill median RT.
for skill, rts in session_rt_by_skill.items():
    prior_history = state.rt_history_sec[skill]        # PRIOR sessions only
    session_median = _quantile(sorted(rts), 0.5)       # THIS session's per-skill median
    guard_statuses[skill] = evaluate_guess_guard(
        p_l=state.bkt_states[skill].p_l,
        median_item_response_time_sec=session_median,
        rt_history=prior_history,
        theta_B=..., q=..., n_min=...,
    )
    state.rt_history_sec[skill].extend(rts)            # append AFTER evaluating
```

### What to build

1. **Persist per-learner/per-skill first-attempt RT history across sessions.** Two viable options —
   pick one and record the reasoning in the docstring:
   - **(preferred)** A repository read that reconstructs prior-session per-skill RTs from existing
     `b_attempts` + `b_item_opportunities` rows. No migration, no new table, and the data is already
     there. Filter exactly as the generator does: `event_kind == "RESPONSE"` (equivalently, not
     `timeout_no_response`) and `client_elapsed_ms > 0`, from sessions **strictly before** the
     current one.
   - A dedicated per-(learner, skill) RT-history table, if the query proves too costly. This needs a
     migration and introduces a second source of truth — prefer the query.
2. **Pass prior-session history as `rt_history`.** Keep this session's own per-skill median as the
   comparison value — compute it from the current session's RTs, as now.
3. **Keep every parameter as-is:** `q = floor_quantile = 0.1`, `n_min = floor_min_obs = 5`,
   `theta_b` unchanged. `_MEDIAN_QUANTILE = 0.5` stays; `_MEDIAN_MIN_OBSERVATIONS = 1` stays (it
   governs the *median*, which is legitimately computable from one observation — it is the *floor*
   that must come from prior history).
4. `INSUFFICIENT_EVIDENCE` remains the honest answer when prior history is below `n_min`. That is
   correct behaviour, not a failure — early sessions genuinely have no floor. Do not invent a
   fallback floor.

### Acceptance

- A test constructing a learner with ≥5 prior-session fast responses on a skill, then a session with
  an implausibly fast median and `p_l > theta_b`, **produces `TRIGGERED`**. This is currently
  impossible and is the single most important assertion in this work order.
- A test with insufficient prior history yields `INSUFFICIENT_EVIDENCE`.
- A test with normal-speed responses yields `NOT_TRIGGERED`.
- The current session's own RTs do **not** influence its own floor.

---

## 3. BF-2 — Stop destroying timeout submissions — **HIGH**

### The defect

`app/application/attempt_submission.py:213-219`:

```python
is_timeout = now >= opportunity.timeout_deadline_utc
response_matched: bool | None = None
submitted_value: str | None = None
event_kind = "TIMEOUT" if is_timeout else "RESPONSE"
if not is_timeout:
    ...  # only here is submitted_value populated
```

On timeout the learner's answer is never read and never persisted. `submitted_value` is written as
`NULL`. **This is irreversible** — no later fix recovers answers already discarded, so every session
run before this lands is permanently degraded.

### Scope — read carefully, this fix stops deliberately short

There are **two** separable changes here, and only the first is in scope:

- **IN SCOPE — persist the submitted value.** Write `body.submitted_value` to
  `AttemptRecord.submitted_value` on the timeout path. The column already exists and is nullable.
  This changes **no scoring**: keep `response_matched = None`, keep `event_kind = "TIMEOUT"`, and
  leave the first-attempt BKT gate (`attempt_index == 1 and event_kind == "RESPONSE"`) exactly as
  it is. A timeout continues to feed BKT as before. This is pure data preservation.
- **OUT OF SCOPE — the taxonomy/scoring split.** Splitting "late response" from "true
  non-response" into separate categories, or comparing the late value for correctness, **changes
  what counts as a BKT observation** and contradicts the generator's FROZEN §6.10 timeout contract.
  That is a **Gate B governance decision**, not a code review finding. Do not implement it. Record
  it as still-open.

Doing only the in-scope half stops the irreversible loss immediately while leaving the measurement
semantics untouched for the owners to decide.

### Acceptance

- A timeout submission persists a non-null `submitted_value`.
- `response_matched` remains `NULL` on timeout; `event_kind` remains `"TIMEOUT"`.
- No change to any mastery/BKT assertion in the existing suite — if a BKT test changes behaviour,
  you have gone too far.

---

## 4. BF-3 — Add an estimator-input parity test — **HIGH**

### Why this is needed

`test_be4f_parity.py` asserts **task-construction** parity, and the wheel pinning asserts **code
identity**. Both pass today. Neither can detect the backend passing statistically wrong arguments
to a correct function — which is exactly how BF-1 survived. That is the structural gap.

### What to build

A test that runs a fixed synthetic learner history through the backend's estimator call path and
asserts agreement with the reviewed package's expected values for:

- **Guess-guard status** per skill, given a known prior-session RT history (the BF-1 case).
- **RT aggregates** — mean, median, std — including the `n < 2` and zero-variance edge cases (see
  BF-4; the assertion should encode `None`, not `0.0`, and is expected to **fail until the wheel is
  rebuilt**. Mark it `xfail` with a reason referencing BF-4, so it converts to a passing test the
  moment the rebuild lands rather than being forgotten).

Assert on **estimator inputs and outputs**, not just on constructed tasks. That is the whole point.

---

## 5. BF-4 — Wheel rebuild — **BLOCKED, do not start**

**Do not do this yet.** The wheel must be rebuilt from a `Yass` commit containing both `e41b641`
(the RT-std fix) **and** the generator changes currently being made by the supervising agent.
Rebuilding now would mean rebuilding twice.

Recorded here so the sequencing is explicit. When unblocked, the rebuild must update **all three
pinned locations together**:

1. `requirements.lock` (the `--hash=sha256:` line)
2. `tests/fixtures/runtime_bundle/valid_unapproved_bundle.json` → `generator.checksum.value`
3. `provenance/component-b-live-engine-manifest.json` → `wheel_sha256`

plus the `COPY` line in the `Dockerfile` if the filename version changes. All four currently agree
on `faa5760df1f5a3874f38f8103cdaaa88a14b3190216e46ab21765eee65a70c29` — verify they agree again
afterwards. Edit the catalogue without recomputing hashes and every question request starts failing
with a 409 that gives no hint the cause was a stale hash.

**What this rebuild fixes when it lands:**
- The RT-std defect: a session with one non-timeout response (or identical response times) persists
  `response_time_std_ms = 0.0`, where the B→3 contract requires `PositiveTiming | None` (`gt=0.0`).
  A std of zero from `n=1` is undefined, not measured. Fixed upstream in `e41b641`.
- Known Issue 3: the `B-NS07` conservation `delta`-in-prompt fix, currently inert in `packaging/`.

---

## 6. Documentation fixes — small, do them

In `Component_B_Backend_Overview.md`:

1. **Add the RT-std defect as a seventh row** to the §8 known-issues table (status: *blocked on
   wheel rebuild*), and note in §7 that the wheel pin holds back a **measurement** fix as well as a
   rendering fix. §7 currently uses `B-NS07` as its only example, which leaves readers believing the
   rendering fix is the only thing behind the pin.
2. **Reconcile the fix identifiers.** The Overview calls them `BE-P1` (choice ordering) and `BE-S1`
   (sequencing spacing); the code calls them `BE-C2 Part A` (`presentation.py:101`) and `BE-P2`
   (`opportunity_selection.py:211,364`). An auditor grepping for `BE-P1`/`BE-S1` finds nothing. Pick
   one scheme, apply it in both places, and keep the other as an alias in the table.
3. **Add BF-1 as a known issue** with its status once fixed.

---

## 7. Suggested order

1. **BF-2** (persist timeout values) — smallest, stops irreversible loss immediately. Do it first.
2. **BF-1** (guess-guard) — the critical correctness fix.
3. **BF-3** (input-parity test) — encodes both, and the `xfail` pre-stages BF-4.
4. **§6 doc fixes.**
5. **BF-4** — only when the supervising agent confirms the generator side is merged.

---

## 8. Verification

```bash
# Reproduce BF-1 before fixing (floor and median from the same sample)
sed -n '450,470p' app/application/session_completion.py
grep -n "_MEDIAN_QUANTILE\|_MEDIAN_MIN_OBSERVATIONS" app/application/session_completion.py
grep -n "floor_quantile\|floor_min_obs" app/application/opportunity_selection.py

# Reproduce BF-2 before fixing
sed -n '210,222p' app/application/attempt_submission.py

# Full suite — must stay green throughout
pytest

# Boundary guards must still pass (these protect the architecture, not just behaviour)
pytest tests/test_be2_architecture_guards.py tests/test_be3_live_engine_boundary.py -v

# Hash chain (should agree before and after; all four the same value)
sha256sum provenance/wheels/upadya_component_b_live_engine-*.whl
grep -A1 "upadya_component_b_live_engine" requirements.lock
grep '"wheel_sha256"' provenance/component-b-live-engine-manifest.json
grep -A3 '"source_identifier"' tests/fixtures/runtime_bundle/valid_unapproved_bundle.json
```

**Report back:** which fixes landed, the new tests and what they assert, anything where the code
contradicted this work order (trust the code — this document was written from a static read and
may be wrong), and anything you found that is not listed here.
