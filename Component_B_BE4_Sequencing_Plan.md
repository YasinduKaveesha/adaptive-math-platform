# Component B — BE4 Live Learning Flow: Sequencing Plan

> **Status:** SUPERVISOR SEQUENCING GUIDANCE — decomposes `backend/BEplan.md §9`; **overrides nothing**;
> **authorizes no implementation**. Parameter values remain gated per the provenance records.
> **Date:** 2026-07-26 · **Repo HEAD at authoring:** `75727ef` (branch `B_frontend`).

This document decomposes the single monolithic `PROMPT BE4` in `Component_B_Build_Plan.md` into safe,
individually-closeable batches (BE4a–f). It restates already-approved plan material; where it names a governed
value it cites the governing source rather than re-deciding it. `backend/BEplan.md §9` and the
`Component_B_Build_Plan.md` `PROMPT BE4` / `CLOSURE BE4` remain canonical.

---

## 1. Context

BE4 is the live learning loop: select → present → attempt → hint/retry → **first-attempt-only** BKT → complete.
The directing goal: **do not reinvent the scientific logic** — reuse the existing generator implementation at
`Yass/Implementation_v1.0/component_b_generator` — and **guarantee the live backend produces the same output
characteristics as the generator** ("same characters" = deterministic parity for identical inputs).

**This is already the architecture, not a new copy.** BE3 vendored a *minimal, reviewed* copy of the generator
(`upadya-component-b-live-engine`) and BE3b built `LiveEngineAdapter`
([backend/app/infrastructure/live_engine/adapter.py](backend/app/infrastructure/live_engine/adapter.py)), which
calls the generator's own pure functions with **no formula copied or rewritten**. BE4 therefore **orchestrates
the existing adapter methods** behind real session persistence and HTTP endpoints. No further vendoring, and no
full/"exact" copy — an exact copy would pull in the **13 prohibited synthetic/dataset modules** (cohort,
hidden-truth, simulated answers/timing, dataset generators, runner, pilot) barred from the live app by
`backend/provenance/component-b-live-engine-reuse-map.json` and the scientific non-negotiables.

**Intended outcome.** A complete BE4 live loop where every scientific step is a call into `LiveEngineAdapter`,
plus a **deterministic parity test** proving the live path reproduces the generator's characterized output
byte-for-byte.

---

## 2. Governance precondition (execution-ready, NOT execute-now)

Per the Scientific-Gate Decision Pack (`Upadya/Component_B_Scientific_Gate_Decision_Pack_v1.0.md`, SG-16 §28,
§44, §43/§49) three-tier model, **implementation must not start until**:

- **(a) BE4 engineering** — TEST-provenance, DRAFT bundles only: the **§44 narrow amendment** is adopted by real
  named owners (project supervisor + Component B owner) and recorded in `backend/buildLog.md`. Until then, "BE4
  live learning flow" is in `backend/provenance/component-b-closure-decisions.json` `exit_gate.blocked_scope`.
- **(b) Live values / pilot** — full named sign-off on the SG-01…SG-15 slate (BKT 7-tuples, θ_B, guess-guard
  numerics, attempt/timeout/completion/safe-progress) recorded as an `APPROVED` runtime bundle. BE4 batches that
  run against real learners stay blocked until this.
- **(c) Production** — calibration **and** validation; no effectiveness/mastery claim.

Engineering (a) uses only TEST-provenance DRAFT bundles that can never be published or selected as a live alias;
the runtime-bundle loader already fails closed on anything but `APPROVED`. **This document starts nothing.**

---

## 3. Architecture principle (satisfies "reuse + parity")

1. **All science flows through `LiveEngineAdapter`.** No route/service/domain code recomputes correctness, BKT,
   sequencing, hints, certification, or task content. If BE4 needs a scientific value, it calls an adapter
   method. The import-boundary guard (`backend/tests/test_be3_live_engine_boundary.py`) keeps the 13 prohibited
   modules unreachable and the adapter the sole `app/` importer — BE4 must not weaken it.
2. **Determinism is driven by real identity → seed lineage.** BE4 supplies `SeedManager` lineage coordinates
   (`student_id, scheduled_session_number, b_session_index, item_index`) from real session/opportunity rows, so
   `build_task_instance` is reproducible. Same inputs ⇒ identical `TaskInstance` ⇒ parity with the generator.
3. **Parity is proven, not assumed.** The parity test asserts that `LiveEngineAdapter.build_task_instance` is
   **byte-for-byte identical** to an independently-constructed direct call into the vendored package's own
   `build_task_instance` (its own `GeneratedItemOpportunity`/`SeedManager`/`load_catalogue`, never via adapter
   helpers), across all 29 implemented templates at every eligible grade, repeat-run deterministic. This proves
   the adapter is a non-diverging pass-through — no formula/seed/sampler/distractor/guard reimplemented.
   **Correction (BE4f):** the characterization digest `b1d8cb33…` (`config_version = b1-smoke-0.1.0`,
   `global_seed = 20260716`, 54 items) in `component-b-characterization.json` is NOT the anchor and is **not
   adapter-reproducible** — BE4f established it is a research **cohort-pipeline** output whose regeneration
   requires the prohibited `pipeline`/`cohort`/`behaviour.attempt_loop`/item-count-draw modules. Reproducing it
   would breach the reuse boundary, so the byte-identical A/B test above is the correct (and stronger) proof.

---

## 4. Batch decomposition (BEplan §9 → BE4a–f)

Each batch reuses the adapter and adds only orchestration/persistence — no new scientific math.

| Batch | BEplan | Adapter methods reused | What BE4 ADDS (no science) | Sub-closure identifier |
|---|---|---|---|---|
| **BE4a** | 4.1 | — (persistence only) | Private opportunity/task-instance/presentation tables + migration (downgrade→re-upgrade tested); one-open-opportunity constraint; server timestamps + timeout deadline; opaque presentation tokens; safe presentation DTO | `BE4A_OPPORTUNITY_PERSISTENCE_BATCH_CLOSED` |
| **BE4b** | 4.2 | `load`/`checksum`, `decide_activation`, `supported_template_ids`, `compute_features`, `score_candidate`, `rank_candidates`, `select_target`, `build_task_instance` | Load pinned bundle + 7 skill states; feed hard grade/impl/availability gates; persist selection provenance; return public DTO | `BE4B_ADAPTIVE_SELECTION_BATCH_CLOSED` |
| **BE4c** | 4.3 + 4.4 | `normalize_answer`, `answers_equivalent`, `correct_answer_raw`, `predict`, `posterior`, `update` | Idempotent attempt submit; server-derived attempt index under lock; server timestamps; **first-attempt-only** atomic BKT + immutable mastery transition; replay safety; infra-failure ≠ wrong attempt | `BE4C_ATTEMPT_AND_BKT_BATCH_CLOSED` |
| **BE4d** | 4.5 | `get_hint`, `required_distractor_count` | Governed L1/L2/L3 hint events (fail-closed via adapter), persisted separately; retries never a BKT observation; no answer leakage | `BE4D_HINTS_RETRIES_BATCH_CLOSED` |
| **BE4e** | 4.6 | `plausibility_floor`, `evaluate`, `certify_skill`, `aggregate_session` | Completion rules; next-or-complete atomic; safe progress (no raw BKT); recovery (restart/dup/stale token) | `BE4E_COMPLETION_RECOVERY_BATCH_CLOSED` |
| **BE4f** | 4.7 | (verifies all) | Full transactional sweep + **deterministic parity test** + import-boundary re-check + Exit Gate | `BE4_LIVE_LEARNING_FLOW_BATCH_CLOSED` |

**Sequencing rules.** Strictly sequential a → b → c → d → e → f. Each batch gets its own separate GO/NO-GO
closure and its own scoped `git add backend/` commit before the next begins; no batch starts on an unclosed
predecessor. Every batch enforces the §1.4 scientific non-negotiables + the §1.6 reuse boundary, appends a dated
`backend/buildLog.md` entry, and leaves the commit to Yasindu. The overall Exit-Gate identifier
`BE4_LIVE_LEARNING_FLOW_BATCH_CLOSED` matches `Component_B_Build_Plan.md` `CLOSURE BE4`.

> **Parameter note.** In *engineering*, BE4b–e wire scientific parameters as **fail-closed bundle inputs tested
> against TEST-provenance DRAFT fixtures** — not approved values. The real `APPROVED` values slot in later at
> bundle-approval time (gate (b)) with no code change.

---

## 5. Critical files

- **Reused as-is (do not modify the science):**
  [backend/app/infrastructure/live_engine/adapter.py](backend/app/infrastructure/live_engine/adapter.py),
  `backend/app/domain/live_engine/*` (ports/types/errors), `backend/app/infrastructure/runtime_bundle*` (loader).
- **New persistence (BE4a):** migration under `backend/alembic/versions/` adding
  opportunity/task-instance/attempt/hint/mastery-transition tables (follow the existing 12-table conventions in
  `backend/app/models` / `b_session*`).
- **New orchestration services (BE4b–e):** thin session-loop services under `backend/app/services/` that call
  `LiveEngineAdapter` — no scientific math of their own.
- **New routes (BE4b–e):** `backend/app/api/routes/` alongside `b_session.py` (select / attempt / hint /
  complete).
- **New tests:** `backend/tests/` — first-attempt-only, concurrency/replay, fail-closed, privacy-field scans,
  and the **parity test** asserting `adapter.build_task_instance` == the vendored package's own
  `build_task_instance` byte-for-byte (all 29 templates × eligible grades), repeat-run deterministic.

---

## 6. What must NOT happen (boundary guards to keep green)

- No new `app/` importer of `component_b_generator` other than the adapter (guard test stays green).
- No import/copy of the 13 prohibited modules; no synthetic-dataset generation, simulated answers, or simulated
  timing in the live path.
- No `population`/`dd_subtype`/hidden-truth field anywhere near live BKT (`BBKTConfig` already `extra="forbid"`).
- No bundle used by BE4 engineering is `APPROVED`, published, or alias-selectable — TEST-provenance DRAFT only.
- Answers / accepted-answer sets / scoring / scientific params never appear in any client DTO.

---

## 7. Verification (end-to-end)

1. **Parity (the "same characters" proof):** assert `adapter.build_task_instance` produces byte-for-byte
   identical canonical JSON to an independent direct call into the vendored package's own `build_task_instance`
   for identical inputs (all 29 implemented templates × eligible grades); repeat runs byte-identical. (The
   `b1d8cb33…` characterization digest is a prohibited-pipeline output and is NOT adapter-reproducible — see §3.)
2. **Import boundary:** `pytest backend/tests/test_be3_live_engine_boundary.py` stays green (13 prohibited
   modules unreachable; adapter the sole importer).
3. **First-attempt-only BKT:** attempt-1 produces exactly one mastery transition; retries/hints produce none;
   replay returns the original without a second update.
4. **Full transactional sweep (BE4f):** correct/incorrect/timeout/hint/retry/completion; concurrent duplicate
   attempts + hints; DB failure before/after mastery calc; clock disagreement; grade gate excludes ×/÷ at
   Grade 2; public payload + log field scan for forbidden fields.
5. **Migration:** downgrade → re-upgrade cycle passes; alembic drift check clean.

---

## 8. Relationship to governed documents

- `backend/BEplan.md §9` (BE4.1–4.7 + Exit Gate) and `Component_B_Build_Plan.md` (`PROMPT BE4` / `CLOSURE BE4`)
  remain **canonical**. This document is the batch-sized execution sequence derived from them.
- Scientific parameter values remain governed by `backend/provenance/component-b-closure-decisions.json` and
  `backend/provenance/component-b-scientific-parameter-authorization.json`, and stay **gated** until real named
  sign-off (gate (b)).
- The engineering-start question is governed by SG-16 / §44 of the Scientific-Gate Decision Pack (gate (a)).
