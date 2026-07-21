# Component B Backend Build Log

> This is the living, append-only development audit log for the Component B backend. Future work
> must be appended as a new dated phase or batch. Earlier entries must not be removed, rewritten,
> or silently altered. Each entry records scope, sources, files, commands, evidence, errors, fixes,
> decisions, limitations, current state, and the exact next task.

---

## Phase BE0 — Baseline Freeze and Characterization — READY FOR REVIEW, NOT FORMALLY APPROVED

Completed: 2026-07-22 Asia/Colombo (`2026-07-21` UTC)  
Build target: `Dev/backend/`  
Scientific source repository: `Yass`  
Authorized by: the user's BE0-only task, `Dev/backend.md`, the Component B specifications and
registers, and the existing pinned Component B generator implementation

### 1. Build target and scope

This phase freezes and characterizes the existing Component B scientific generator before the
backend depends on it. It does not implement new scientific behavior.

In scope:

- source, shared-module, dependency, catalogue, and test provenance;
- exact dependency locks;
- catalogue coverage and response-format audit;
- deterministic-generation verification;
- fail-closed deferred-template verification;
- grade-gate, first-attempt BKT, skill-isolation, sequencing, hint, certification, and aggregation
  characterization;
- an immutable runtime-bundle manifest schema;
- packaging and live-versus-synthetic boundary decisions;
- permanent Docker/PostgreSQL decisions for the first future BE1 batch.

Explicitly out of scope and not started:

- BE1 Docker implementation;
- PostgreSQL services or database schemas;
- SQLAlchemy or Alembic;
- authentication and `/api/v1/me`;
- session APIs;
- live question, attempt, hint, mastery, or completion endpoints;
- Component C or Component 3 implementation.

### 2. Source documents followed

Application design:

- `Upadya/Dev/backend.md` — authoritative backend architecture and BE0–BE6 sequence.
- `Upadya/Dev/frontend.md` — future public API/client contract boundary.
- `Upadya/componantBArchi.md` — Component B architecture and scientific boundary context.

Component B authorities:

- `Yass/Component_B_Generator_v1.0/SPEC.md`.
- `Yass/Component_B_Generator_v1.0/R26-IT-138_Component_B_Phase_B2B_Learner_Response_and_Attempt_Spec_v1.0.md`.
- `Yass/Component_B_v1.0/R26-IT-138_Component_B_Item_and_Task_Set_Catalogue_v1.0.md`.
- `Yass/Component_B_v1.0/R26-IT-138_Component_B_Empirical_Statistical_Parameters_v1.0.md`.
- `Yass/Registers_v0.3/R26-IT-138_Component_B_Variable_Register_v0.3.md`.
- `Yass/Registers_v0.3/R26-IT-138_Shared_Foundation_Decision_Register_v0.3.md`.
- `Yass/Implementation_v1.0/CONTRACT_IMPLEMENTATION_REPORT.md`.
- `Yass/build/buildB/build1.md`.
- `Yass/Deployment_MLOps_v1.0/R26-IT-138_Backend_Deployment_Recalibration_and_Model_Optimization_Strategy_v1.0.md`.

Build-log structure reference:

- `HereWeGo/Dev/build1.md` from the Reells project. Its dated-batch, context, commands, errors,
  fixes, verification, decisions, and caveats structure was adapted here.

### 3. Files created

`backend/provenance/component-b-baseline.json`

- Machine-readable authoritative BE0 baseline.
- Records source, shared-module, runtime, dependency, catalogue, coverage, scientific status,
  packaging, governance, and test provenance.

`backend/provenance/requirements-generator.in`

- Exact 29-package direct and active-transitive dependency closure derived from the environment
  that passed the initial 885-test run.
- Separates generator/scientific dependencies from the FastAPI application's `requirements.txt`.

`backend/provenance/requirements-generator-win-py310.lock`

- Hash-locked resolution for CPython 3.10 on Windows x64.
- Installed successfully into a clean temporary virtual environment with `pip --require-hashes`.

`backend/provenance/component-b-coverage.json`

- Structured 36/29/7 catalogue partition.
- Records deferred reasons, grade activation, catalogue/runtime response formats, and four explicit
  response-format vocabulary mismatches.

`backend/provenance/component-b-characterization.json`

- Structured test and behavioral evidence.
- Records full clean-lock suite results, deterministic digest, fail-closed result, focused behavior
  suite, and the meaning of Guess-Guard `INSUFFICIENT_EVIDENCE` for certification.

`backend/provenance/runtime-bundle.schema.json`

- Draft 2020-12 JSON Schema for immutable Component B runtime bundles.
- Includes all required code, schema, generator, catalogue, scientific configuration, policy,
  approval, activation, and compatibility fields.

`backend/buildLog.md`

- This living, append-only audit log.

### 4. Files modified

`backend/provenance/component-b-baseline.json`

- Initially created with source/catalogue/coverage and the first test result.
- Expanded during the same BE0 phase with clean hash-lock evidence, shared-module checksums,
  scientific statuses, packaging boundaries, response formats, and runtime-bundle references.

No generator source, Component B test, FastAPI endpoint, database, frontend, or BE1 infrastructure
file was modified.

### 5. Environment and version information

Verification host:

```text
OS: Microsoft Windows NT 10.0.26200.0
Architecture: x64
Python runtime family: CPython 3.10
Exact Python: 3.10.20
Initial environment: conda:component_b
Authoritative reproduction environment: clean temporary venv installed from the committed hash lock
```

Direct generator dependencies verified:

```text
pydantic       2.13.4
PyYAML          6.0.3
jsonschema      4.25.1
pytest          9.1.1
scikit-learn    1.7.2
numpy           2.2.6
pandas          2.3.3
```

The committed input/lock also pins every active transitive dependency, for 29 packages total.

### 6. Provenance values

```text
Yass Git commit:
  0e86fdcbc0ffcdbda3d37c742e83b1d532910e2b

Component B generator Git tree:
  73acb113bbb179f5946333c27b0142c43f3063f3

Component B tracked-source manifest SHA-256:
  fd4f052e41539434ad4ff6bbb72fa01815ef750ceeb0a6d8ebc6fbc481e07e2c

Shared models Git tree:
  1f1c517043e7ac43197506ea8edfd0339021b5c4
Shared models manifest SHA-256:
  9ee1cc5ef18d09d5ae543235501d21ac1bc1b1b45bf8baca5c5348044c83b239
models/contracts.py SHA-256:
  b730c3f60b4565cc3bb390480337a821f229306f846884546727e8f42abb5e15

Shared validators Git tree:
  dcd9bb307567ce0b811ba1bc40a0c24a0a515303
Shared validators manifest SHA-256:
  4bc2066d77a5283cab7ac6eb24c37a33c75ab94e65da3938337f8f189173b386
validators/contract_validators.py SHA-256:
  613a81085ea12983791997c42d9a6f59fa5597610417f81f6493e91e8f570fee

Backend repository commit available at recording time:
  a360b8c6390bc77ae13989dcc03e7198388ce70b
The new backend BE0 files were not committed at recording time.
```

The generator's declared package metadata remains stale:

```text
PHASE=B1
CATALOGUE_VERSION=1.0
GENERATOR_PACKAGE_VERSION=0.1.0-phase-b1
```

The implementation contains B1 through B6. Package metadata must never be the sole provenance key.

### 7. Dependency and lock decisions

Input:

```text
backend/provenance/requirements-generator.in
SHA-256: 8870351034a456771dd5e535a18c282b20b54d3b36a6471f439ebcc459430b88
```

Lock:

```text
backend/provenance/requirements-generator-win-py310.lock
SHA-256: 27c04928c42688e45d7c82e44d07623c0f7d9c3cee8dd2ab3650532d32d6b04a
Target: CPython 3.10 / Windows x64
Packages: 29
Distribution SHA-256 hashes: included and required
```

Decision:

- A raw `pip freeze` was rejected because the `component_b` environment contains unrelated Jupyter,
  Gradio, media, browser, database, and other project dependencies.
- `conda list --explicit` was rejected as the only lock because most scientific packages were pip
  installed and absent from the Conda explicit list.
- The selected mechanism derives the minimum active transitive dependency closure from package
  metadata, pins every version, generates distribution hashes, and verifies installation into a
  clean environment.
- Before BE1 Docker use, the same exact-version input must be resolved and tested for Python 3.11 on
  Linux. No scientific dependency may be silently upgraded during that step.

### 8. Catalogue coverage

Catalogue:

```text
Path: Component_B_v1.0/R26-IT-138_Component_B_Item_and_Task_Set_Catalogue_v1.0.md
Version: 1.0
Status: PROPOSED_FOR_APPROVAL
SHA-256: eaf073da8af155bdb935b7c2abfba04f892bbfecf44522f20f044aeec4b579ac
```

Coverage:

```text
Total:       36
Implemented: 29
Deferred:     7
Partition complete: yes
```

Deferred and fail-closed:

```text
B-CNT05-FORWARD-FROM-N   CALIBRATION_PENDING
B-NS01-READ-NUMERAL      insufficiently specified
B-NS06-NUMBER-LINE       CALIBRATION_PENDING
B-PV05-REGROUP-ONES      insufficiently specified
B-PV06-UNGROUP-TEN       insufficiently specified
B-SUB02-DIFFERENCE       CALIBRATION_PENDING
B-DIV04-INVERSE-FACT     CALIBRATION_PENDING
```

An explicit construction attempt for every deferred template raised
`UnsupportedTemplateError`. No generic fallback question was generated.

Grade activation:

```text
Grade 2: 14 active templates; counting, number_sense, place_value, addition, subtraction.
         Multiplication and division excluded.
Grade 3: 16 active templates; all seven eligible skills represented.
Hard gates: grade, implementation support, catalogue availability.
Prerequisites: soft scoring input only.
```

Response formats:

- The catalogue machine block declares 14 distinct response-format values.
- The 29 implemented sampler strategies expose nine runtime response-format values.
- Four implemented templates use a runtime label different from the catalogue label:
  - `B-ADD02-COUNT-ON`: `single_integer_or_mark` -> `single_integer_or_choice`.
  - `B-CNT06-SKIP-COUNT`: `ordered_integer_sequence` -> `single_integer`.
  - `B-PV02-DECOMPOSE-2D`: `structured_pair` -> `expanded_form`.
  - `B-PV04-DECOMPOSE-3D`: `structured_triple_or_expression` -> `expanded_form`.
- Existing tests pass, but a reviewed backend adapter mapping is unresolved. The vocabularies must
  not be assumed identical.

### 9. Test and verification results

Initial confirmation in the existing Conda environment:

```text
885 passed in 315.21s (0:05:15)
Wall duration: 318.05s
Exit code: 0
```

Authoritative clean hash-lock reproduction:

```text
Started:  2026-07-21T19:03:30.4054736Z
Finished: 2026-07-21T19:08:23.1680282Z
Python:   3.10.20
Collected: 885
Passed:    885
Failed:    0
Skipped:   0
Warnings:  0
Errors:    0
Pytest duration: 292.09s (0:04:52)
Wall duration:   292.763s
Exit code: 0
```

Deterministic generation:

```text
Config version: b1-smoke-0.1.0
Config hash: 715b2a4200771e8ccea63e88a32884d3f660922ec37abfcc72519c9542974d0b
Global seed: 20260716
Generated private item instances: 54
Repeated output: byte-identical
Private output SHA-256: b1d8cb3388ac7e47dd353af68210b24debf3d49791f40a6447ad57f74641926c
```

Focused behavior characterization:

```text
20 passed in 1.31s
Wall duration: 2.028s
Exit code: 0
```

Confirmed behavior:

- only attempt one creates the BKT observation;
- later retry success does not add another BKT observation;
- each skill has an independent BKT state and cross-skill transfer is rejected;
- orchestration equals direct calls to the existing BKT formulas;
- sequencing weights are exactly 0.50/0.30/0.20;
- ranking and tie-breaking are deterministic;
- prerequisites remain soft;
- all 29 implemented templates expose nonblank exact L1/L2/L3 catalogue hints;
- missing/blank hints fail closed;
- hint code has no network, LLM, generation, or paraphrase fallback;
- Guess-Guard `INSUFFICIENT_EVIDENCE` prevents certification even above `theta_B`;
- certification is recomputed and non-sticky; contradictory evidence can decertify;
- aggregation behavior for first-attempt accuracy, retries, hints, non-timeout timing, error classes,
  and latest per-skill estimated mastery passed.

### 10. Commands executed

Representative provenance commands:

```text
git -C <Yass> rev-parse HEAD
git -C <Yass> rev-parse HEAD:Implementation_v1.0/component_b_generator
git -C <Yass> ls-tree -r --name-only HEAD -- Implementation_v1.0/component_b_generator
Get-FileHash -Algorithm SHA256 <catalogue>
conda run -n component_b python -c <catalogue/dependency metadata query>
```

Dependency resolution and verification:

```text
<component_b-python> -m uv pip compile backend/provenance/requirements-generator.in \
  --generate-hashes --python-version 3.10 --python-platform windows \
  --no-header --no-annotate

<component_b-python> -m venv C:\tmp\component-b-be0-venv-20260722

C:\tmp\component-b-be0-venv-20260722\Scripts\python.exe -m pip install \
  --require-hashes -r backend/provenance/requirements-generator-win-py310.lock
```

Complete suite command, from `Yass/Implementation_v1.0`:

```text
C:\tmp\component-b-be0-venv-20260722\Scripts\python.exe -B -m pytest -q --tb=short \
  -p no:cacheprovider \
  tests/test_activation_classification.py \
  tests/test_b_generator_phase_b1.py \
  tests/test_b_generator_phase_b2a.py \
  tests/test_b_generator_phase_b2a2.py \
  tests/test_b_generator_phase_b2b0.py \
  tests/test_b_generator_phase_b2b1.py \
  tests/test_b_generator_phase_b2b2.py \
  tests/test_b_generator_phase_b2b3.py \
  tests/test_b_generator_phase_b3.py \
  tests/test_b_generator_phase_b4.py \
  tests/test_b_generator_phase_b5.py \
  tests/test_b_generator_phase_b6_0.py \
  tests/test_b_generator_phase_b6_1_leakage.py \
  tests/test_b_generator_phase_b6_2_fidelity.py \
  tests/test_b_generator_phase_b6_3_pilot.py
```

Focused characterization command selected exact test nodes from B3, B4, B2B3, and B5 for
first-attempt BKT, skill isolation, sequencing, hints, certification, and aggregation. The complete
node list and structured results are preserved in `component-b-characterization.json` and this
phase's execution record.

### 11. Errors, root causes, and fixes

#### Error 1 — Windows sandbox helper intermittently failed

Symptom:

```text
helper_read_acl_helper_spawn_failed / setup refresh access denied
```

Root cause: transient Codex Windows sandbox-helper launch failure while accessing an in-workspace
file, not a repository permission or JSON-content error.

Fix: retried the same narrowly scoped `apply_patch`; it succeeded. No alternate unsafe write method
was used for authored JSON/Markdown.

#### Error 2 — Windows wildcard passed literally to `rg`

Symptom:

```text
rg ... tests\test_*.py -> filename/directory syntax error
```

Root cause: Windows did not expand the wildcard for that invocation.

Fix: enumerated files with `Get-ChildItem` and used `rg` glob options or explicit paths.

#### Error 3 — Multiline Python rejected by `conda run`

Symptom:

```text
AssertionError: Support for scripts where arguments contain newlines not implemented
```

Root cause: `conda run` cannot forward a multiline `python -c` argument on this Windows setup.

Fix: invoked the exact environment Python executable and passed the helper source through a
temporary process environment variable. No helper file was added to Yass.

#### Error 4 — `uv` script not found through `conda run`

Symptom:

```text
'uv' is not recognized
```

Root cause: the installed module was importable but its console script was not visible through the
`conda run` command path.

Fix: used `<component_b-python> -m uv pip compile`, which resolved the exact same installed module.

#### Error 5 — First fail-closed probe used an invalid opportunity ID

Symptom:

```text
GeneratedItemOpportunity validation rejected BE0-001
Expected ^STU-[0-9]{4}-B[0-9]{3}-I[0-9]{3}$
```

Root cause: the verification helper's temporary ID did not follow the governed identifier contract.
The intended unsupported-template code path was not reached.

Fix: reran with `STU-9999-B001-I###` identifiers. All seven deferred templates then raised
`UnsupportedTemplateError`, and no fallback was produced.

#### Error 6 — Response-format `rg` extraction quoting failed

Symptom: a PowerShell/regex quoting combination produced an invalid regular expression while
extracting sampler literals.

Root cause: command quoting, not generator content.

Fix: queried the sampler registry through the pinned Python API and separately parsed the
authoritative machine-readable catalogue YAML block. This also exposed the four real vocabulary
mismatches recorded above.

### 12. Scientific and governance decisions

Status vocabulary used:

```text
APPROVED
APPROVED_FOR_PROVISIONAL_IMPLEMENTATION
PROVISIONAL
ENGINEERING_ASSUMPTION
CALIBRATION_PENDING
DISABLED
UNRESOLVED
```

Current status:

- Seven-skill BKT numeric parameters: `CALIBRATION_PENDING`; no production defaults.
- Certification threshold `theta_B`: `CALIBRATION_PENDING`; no approved value recorded.
- Guess-Guard rule: `APPROVED_FOR_PROVISIONAL_IMPLEMENTATION`; numeric quantile/minimum observation
  values remain `CALIBRATION_PENDING`.
- Sequencing rule and 0.50/0.30/0.20 weights: `APPROVED_FOR_PROVISIONAL_IMPLEMENTATION`.
- Four-session spacing saturation: `ENGINEERING_ASSUMPTION` from the current implementation.
- Hint catalogue: `PROVISIONAL`; exact catalogue text only; fallback `DISABLED`.
- Live attempt limits: `UNRESOLVED`.
- Timeout semantics: `APPROVED_FOR_PROVISIONAL_IMPLEMENTATION`; numeric threshold `UNRESOLVED`.
- Completion policy: `UNRESOLVED`.
- Safe-progress policy: `UNRESOLVED`.
- Cold-start override: `DISABLED`.
- Formal academic/owner sign-off: `UNRESOLVED`.

No missing value was replaced with an invented number.

### 13. Generator packaging decision

Selected planned strategy: pinned internal wheel, status `ENGINEERING_ASSUMPTION` until reviewed.

The future wheel must include:

- `component_b_generator`;
- top-level `models`;
- top-level `validators` when existing serialization/future-boundary adapters are packaged.

The catalogue is a separate governed runtime-bundle artefact supplied by explicit path and checksum.
The loader's repository-relative default must not be relied on by the backend.

Safe live adapter capabilities:

- catalogue loading/activation and coverage;
- deterministic task generation;
- answer normalization/evaluation;
- exact hint lookup;
- BKT state/update math;
- Guess-Guard/certification;
- sequencing;
- aggregation.

Forbidden from the live import graph:

- synthetic learner behavior;
- hidden learner truth;
- latency simulation;
- cohort generation;
- `pipeline.py`;
- `pilot.py`;
- synthetic experiment runners;
- population/`dd_subtype`-driven audit behavior.

### 14. Runtime-bundle manifest decision

`backend/provenance/runtime-bundle.schema.json` requires:

- bundle and schema versions;
- publication state and immutability flag;
- backend code and database schema revision;
- generator identifier/path/interface/checksum;
- catalogue version/checksum/approval;
- BKT, certification, Guess-Guard, sequencing, safe-progress, attempt, timeout, and completion
  configuration versions/checksums/approval;
- frozen sequencing weights;
- disabled cold-start policy;
- bundle approval and activation date;
- API, generator-interface, Python, database, grade, skill, and catalogue compatibility.

Permanent rules:

- publication makes the manifest immutable;
- existing sessions remain pinned to their original bundle;
- activating a new bundle affects only new sessions;
- missing/incompatible artefacts fail readiness closed;
- cold-start remains disabled unless separately approved.

No publishable bundle instance was invented because required configuration versions/checksums and
approval records are unresolved.

### 15. Permanent Docker development decision for BE1 onward

This decision is recorded now and was not implemented during BE0.

From BE1 onward, normal backend development, startup, tests, and verification must run in Docker:

- use a pinned Python 3.11 base image;
- verify and record the exact image tag and resolved digest before use;
- run FastAPI in a service named `api`;
- run PostgreSQL in a separate service named `db`;
- manage both with Docker Compose;
- run tests and verification inside `api`;
- install from committed reproducible lock files;
- run the API as a non-root user where practical;
- keep secrets outside images and committed source;
- add API and database health checks;
- use named volumes for persistent database storage;
- implement graceful startup and shutdown;
- record every Docker command and result in this log.

Expected BE1 commands:

```text
docker compose build
docker compose up -d
docker compose ps
docker compose exec api pytest
docker compose exec api python -m compileall app
docker compose logs api
docker compose logs db
docker compose down
```

Host-runtime exception used in BE0:

```text
Commands: provenance queries, lock generation, clean-venv installation, and generator tests listed above.
Reason Docker could not be used: this task explicitly prohibited implementing the BE1 Docker
environment; BE0 had to characterize the existing pinned generator first.
Reproducibility impact: the initial host Conda environment alone was not accepted as proof.
Independent verification: exact dependency hashes were committed, installed into a clean temporary
venv, and the complete 885-test suite passed again.
```

### 16. Permanent PostgreSQL Docker decision

This decision is recorded now and was not implemented during BE0.

- Use the official PostgreSQL 16 Docker image.
- Never use `postgres:latest`.
- Before BE1 implementation, verify the currently available official PostgreSQL 16 Bookworm patch
  tag and record its resolved image digest.
- Do not invent or record a tag/digest before verification.
- Use service name `db` and hostname `db` inside `DATABASE_URL`; never use `localhost` from `api`.
- Use service name `api` for FastAPI.
- Store `/var/lib/postgresql/data` in a named volume.
- Configure database, user, and password through environment variables.
- Keep real credentials in an uncommitted `.env` or secret manager; commit safe `.env.example`
  placeholders only.
- Never hard-code real passwords in Dockerfile or Compose.
- Add `pg_isready` health checking.
- Make API startup depend on database health.
- Expose PostgreSQL to the host only when local inspection requires it.
- Use Alembic as migration authority.
- Test migrations against PostgreSQL, never SQLite.
- Use the same PostgreSQL integration path in local Docker, CI, and staging.
- Review and record every future PostgreSQL image upgrade.

Intended future shape, not yet created:

```text
services:
  db:
    image: <verified PostgreSQL 16 Bookworm patch tag and digest>
    volumes:
      - component_b_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
  api:
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
volumes:
  component_b_postgres_data:
```

### 17. Assumptions

- The current Yass HEAD is the intended source snapshot for this BE0 record; the Component B
  generator subtree matched the previously inspected tree and remained unchanged through testing.
- The 15-file scope (activation plus all `test_b_generator_phase_*.py`) is the complete existing
  Component B generator suite. Component C tests and future shared B-to-C/B-to-3 contract tests were
  excluded by scope.
- Existing frozen formulas/rules may be characterized without granting production approval to their
  unresolved numeric parameters.
- The pinned internal wheel is the preferred controlled artefact, but its build/review is not claimed
  complete.

### 18. Missing information and unresolved issues

- Formal acceptance/sign-off for the application design set.
- Approved production/pilot BKT parameters for all seven skills.
- Approved certification threshold.
- Approved Guess-Guard quantile and minimum observation count.
- Approved live attempt count, timeout threshold, completion policy, and safe-progress policy.
- Academic/owner approval record for catalogue and scientific configuration.
- Reviewed mapping for four catalogue/runtime response-format mismatches.
- Built and checksummed internal generator wheel.
- Python 3.11/Linux hash lock and clean Docker characterization result; intentionally deferred until
  BE1 Docker foundation is authorized.
- Exact PostgreSQL 16 Bookworm tag/digest and Python 3.11 base tag/digest; deliberately not looked up
  or implemented during BE0.

### 19. Known limitations

- The catalogue is only `PROPOSED_FOR_APPROVAL`.
- Scientific numeric parameters remain provisional/calibration-pending.
- Seven templates remain unavailable.
- Generator package metadata is stale.
- The B6 simulation pipeline has known synthetic limitations and is forbidden from the live path.
- The current hash lock proves Windows/CPython 3.10 reproduction, not the future BE1 Linux/Python
  3.11 container.
- JSON Schema records runtime-bundle immutability semantics but storage/application enforcement must
  be implemented later.
- `buildLog.md` is ignored by the repository's current Markdown `.gitignore` rule. It exists locally
  as requested but will not be committed unless the ignore policy is deliberately changed.

### 20. Current backend state

- Existing FastAPI bootstrap files from earlier work remain unchanged.
- BE0 provenance and characterization artefacts now exist.
- No database or BE1 infrastructure exists.
- No session, question, attempt, hint, mastery, or completion API exists.
- No generator is imported by the FastAPI application.
- The scientific source passed both existing-environment and clean hash-lock suites.

### 21. Completed work

- [x] Source commit/tree/content provenance.
- [x] Shared-module checksums.
- [x] Backend commit recorded.
- [x] Runtime and host recorded.
- [x] Exact scientific dependency closure and hash lock.
- [x] Clean lock installation.
- [x] Fresh complete 885-test result.
- [x] Deterministic fixed-seed private output digest.
- [x] 36/29/7 coverage report.
- [x] Seven deferred templates explicitly fail closed with no fallback.
- [x] Grade gate evidence.
- [x] First-attempt-only BKT and skill-isolation evidence.
- [x] Sequencing evidence.
- [x] Hint provenance/fail-closed/no-LLM evidence.
- [x] Guess-Guard/certification evidence.
- [x] Aggregation evidence.
- [x] Scientific statuses without invented values.
- [x] Packaging and live/offline boundary record.
- [x] Runtime-bundle schema.
- [x] Permanent future Docker/PostgreSQL decisions.
- [x] Living build log.

### 22. Remaining BE0 review work

- [ ] Owner/research review of the baseline and reports.
- [ ] Formal acceptance or documented rejection of the design authority set.
- [ ] Decision on the four response-format mappings.
- [ ] Approval of the packaging strategy and whether wheel construction is required before BE1.
- [ ] Resolution or explicit governed deferral of scientific policy/configuration inputs.
- [ ] Formal decision permitting transition to BE1.

### 23. BE0 exit-gate assessment

Technical characterization gate: **PASSED**.

Evidence:

- exact immutable source and shared checksums;
- clean hash-locked environment recreated successfully;
- 885/885 tests passed;
- deterministic digest reproduced;
- deferred/grade/scientific boundaries verified;
- coverage and characterization reports validate;
- runtime-bundle schema exists.

Formal BE0 phase approval: **NOT PASSED — PENDING REVIEW/APPROVAL**.

Reasons:

- catalogue and scientific approvals remain unresolved/calibration-pending;
- four response-format mappings require review;
- packaging strategy is not yet approved and no wheel is built;
- required owner/academic sign-off is not recorded.

Therefore BE1 must not start yet. The repository is ready for BE0 review, not for a claim of approved
pilot/production readiness.

### 24. Exact recommended next task

Conduct a BE0 governance and packaging review only:

1. Review `component-b-baseline.json`, `component-b-coverage.json`,
   `component-b-characterization.json`, and `runtime-bundle.schema.json`.
2. Decide the four response-format mappings.
3. Approve or revise the pinned internal-wheel packaging strategy.
4. Record which unresolved scientific policy values may remain explicitly deferred and which must be
   supplied before BE1.
5. Record formal owner/research approval or rejection of BE0.

Only after that approval should the first BE1 task begin: create and verify the backend Dockerfile,
`.dockerignore`, and Docker Compose services `api` and PostgreSQL `db` using verified pinned image
tags and digests.

### 25. Final artefact validation

The clean hash-locked environment loaded all four authored JSON files and performed these checks:

```text
JSON_FILES_VALID=4
RUNTIME_SCHEMA_DRAFT_2020_12_VALID=true
RUNTIME_SCHEMA_COMPLETE_DRAFT_INSTANCE_VALID=true
BASELINE_INVARIANTS_VALID=true
VALIDATION_EXIT_CODE=0
```

The runtime schema was validated both as Draft 2020-12 and against a complete in-memory draft
bundle containing every required field. The draft was not saved as an approved bundle because its
scientific policy checksums and approvals are unresolved.

After validation, the Yass repository HEAD was observed at
`848742c1a453648478c6b2ef02d91ca996ea566b` for an unrelated Component C6.0 commit. The BE0 snapshot
remains pinned to `0e86fdcbc0ffcdbda3d37c742e83b1d532910e2b`. Object-level comparison confirmed
that `component_b_generator`, shared `models`, shared `validators`, and the Component B catalogue
are identical across both commits, with no path diff. Therefore the effective Component B source
under test did not change; the concurrent repository movement is recorded rather than silently
rewriting baseline provenance.

---

End of Phase BE0 entry. Append future work below this line; do not rewrite this entry.
## Phase BE0 Closure — Governance, Packaging, and Python 3.11 Reproduction

### Closure scope and reason

This section appends the final BE0 governance and packaging review. It does not start BE1 and
does not add Docker, Compose, PostgreSQL, authentication, session APIs, SQLAlchemy, or Alembic.
The review reconciles the original CPython 3.10 evidence with Python 3.11, registers response
contract decisions, selects a safe generator supply strategy, makes BE0 evidence trackable, and
issues an evidence-based exit decision.

### Files changed

- `backend/provenance/requirements-generator-win-py311.lock` — Windows x64 CPython 3.11 hash lock.
- `backend/provenance/component-b-characterization.json` — preserves Python 3.10 evidence and adds
  the Python 3.11 reproduction, focused suite, deterministic digest, and comparison.
- `backend/provenance/component-b-baseline.json` — adds the intended Python 3.11 Docker/CI baseline,
  reviewed mapping/packaging status, and closure gate.
- `backend/provenance/component-b-coverage.json` — records a reasoned result for each mapping.
- `backend/provenance/component-b-closure-decisions.json` — new machine-readable mapping,
  packaging, governance, approver, blocking, next-action, and exit-gate register.
- `.gitignore` — narrowly unignores the build log and BE0 provenance `.json`, `.in`, and `.lock`.
- `backend/buildLog.md` — this append-only closure record.

No generator scientific source or test was modified.

### Python 3.11 environment and dependency reproduction

```text
C:\tmp\component-b-be0-py311-20260722
CPython 3.11.15, Windows x64
pip 26.1.2
```

Commands:

```text
conda create -y -p C:\tmp\component-b-be0-py311-20260722 python=3.11 pip
conda run -n component_b python -m uv pip compile \
  backend/provenance/requirements-generator.in \
  --generate-hashes --python-version 3.11 --python-platform windows \
  --no-header --no-annotate \
  --output-file C:\tmp\requirements-generator-win-py311.lock
C:\tmp\component-b-be0-py311-20260722\python.exe -m pip install \
  --require-hashes -r backend/provenance/requirements-generator-win-py311.lock
```

The 3.11 lock contains the same 29 exact packages and is byte-identical to the 3.10 lock:
`27c04928c42688e45d7c82e44d07623c0f7d9c3cee8dd2ab3650532d32d6b04a`. This is valid because
`uv` emitted complete compatible distribution hashes for the exact-version input. A clean 3.11
`pip --require-hashes` installation succeeded; no scientific dependency was changed.

### Python 3.11 tests and deterministic comparison

The complete command used the same 15 explicit Component B files recorded in the earlier BE0
section, with `C:\tmp\component-b-be0-py311-20260722\python.exe -B -m pytest -q --tb=short
-p no:cacheprovider`.

```text
Complete suite: 885 collected, 885 passed, 0 failed, 0 skipped, 0 warnings, 0 errors
Exit code: 0
Pytest duration: 192.97 seconds
Output SHA-256: e3c7a35695b240b99c957d4f228ff99cf662726a2f5732a38a7489883c45b6eb

Focused suite: 20 collected, 20 passed, 0 failed, 0 skipped, 0 warnings, 0 errors
Exit code: 0
Pytest duration: 1.59 seconds
Output SHA-256: 7c5450e4934e30b8485d5cc1b4876c144bae83874402b6094af813a7ce776ed1
```

The focused nodes cover first-attempt BKT, independent skill states, Guess-Guard/certification,
sequencing/ties/soft prerequisites, exact fail-closed hints, and aggregation/provenance behavior.

Deterministic Phase B2A generation used `default_b1_config`, seed `20260716`, and canonical JSON
of the private `item_instances` (`model_dump(mode="json")`, sorted keys, compact separators):

```text
Config version: b1-smoke-0.1.0
Config hash: 715b2a4200771e8ccea63e88a32884d3f660922ec37abfcc72519c9542974d0b
Item instances: 54
Private output SHA-256: b1d8cb3388ac7e47dd353af68210b24debf3d49791f40a6447ad57f74641926c
Repeated output: byte-identical
Python 3.10 comparison: exact digest match
```

CPython 3.11.15 therefore passes the characterized scope and becomes the intended Docker/CI
baseline. A Linux/Docker lock still requires generation and verification during separately
authorized BE1 work.

### Response-format mapping review

Catalogue rows, sampler registrations, sampled prompt/operand shapes, answer equivalences, and
frontend source were reviewed. No frontend renderer/input contract exists for the response-format
vocabulary. No new format was invented, and all four remain unresolved:

| Template | Catalogue | Generator | Result | Required decision |
|---|---|---|---|---|
| B-ADD02 | `single_integer_or_mark` | `single_integer_or_choice` | UNRESOLVED | Numeric endpoint does not prove mark support; owner must select behavior. |
| B-CNT06 | `ordered_integer_sequence` | `single_integer` | UNRESOLVED | Terminal-only generator is narrower; owner must confirm v1 intent. |
| B-PV02 | `structured_pair` | `expanded_form` | UNRESOLVED | Multi-equivalence text is not an exact pair DTO; frontend contract required. |
| B-PV04 | `structured_triple_or_expression` | `expanded_form` | UNRESOLVED | Expression behavior is plausible, but triple/parser support is unproven. |

Exact sources, sampler shapes, reasoning, and short decision requests are recorded in
`component-b-closure-decisions.json`.

### Generator packaging decision

- Pinned internal wheel — selected: immutable, installable, checksum-verifiable, checkout-independent.
- Immutable source artefact — acceptable fallback only with equivalent manifest, isolation, and tests.
- Repository-relative source import — rejected because the checkout and layout are mutable.

The wheel must include `component_b_generator`, top-level `models`, top-level `validators`, and
metadata binding it to the pinned Yass commit/tree. The catalogue remains a separate checksummed
runtime-bundle asset. A PEP 440 version derived from generator version plus pinned short commit is
proposed, but the final string needs packaging-owner approval because existing metadata is stale.

```text
python -m build --wheel --no-isolation <approved immutable packaging source directory>
python -m pip install --no-deps --require-hashes -r <wheel-lock>
python -I -c <import component_b_generator, models, validators; verify provenance>
<run complete Component B suite>
```

Wheel construction is not complete and remains separately approved work. Mutable-checkout runtime
imports are prohibited.

### Governance register

`component-b-closure-decisions.json` records status, source, BE1/session/pilot blocking, approver,
approved value or deferral, and next action without inventing values.

- Catalogue is PROVISIONAL and blocks BE1 authorization, session APIs, and live use.
- BKT, certification, and Guess-Guard numerics are CALIBRATION_PENDING; they do not block generic
  scaffolding but block live session APIs and pilot/production.
- Attempt limits, completion, and safe progress are UNRESOLVED and block session/live work.
- Timeout semantics are provisional; the numeric threshold is unresolved.
- Cold start is a governed fail-closed deferral: DISABLED.
- Named owner/academic sign-off is UNRESOLVED and blocks BE1 authorization.

### Git tracking review

The global Markdown ignore remains. Only these exceptions were added:

```text
!/backend/buildLog.md
!/backend/provenance/
!/backend/provenance/*.json
!/backend/provenance/*.in
!/backend/provenance/*.lock
```

```text
git check-ignore -v backend/buildLog.md
.gitignore:33:!/backend/buildLog.md backend/buildLog.md

git check-ignore backend/buildLog.md
exit 1 (not ignored)

git check-ignore backend/provenance/component-b-baseline.json
exit 1 (not ignored)

git status --short --untracked-files=all
?? backend/buildLog.md
?? backend/provenance/component-b-baseline.json
?? backend/provenance/component-b-characterization.json
?? backend/provenance/component-b-closure-decisions.json
?? backend/provenance/component-b-coverage.json
?? backend/provenance/requirements-generator-win-py310.lock
?? backend/provenance/requirements-generator-win-py311.lock
?? backend/provenance/requirements-generator.in
?? backend/provenance/runtime-bundle.schema.json
```

They are untracked but commit-eligible. No broad Markdown exception was added.

### Problems and fixes

1. No installed 3.11 launcher existed; a clean Conda prefix supplied CPython 3.11.15.
2. The 3.11 lock matched the 3.10 SHA. Clean hash-enforced 3.11 installation verified this was
   expected compatibility, not a missing output.
3. Sampler inspection initially assumed Pydantic output; `SampledContent` is a dataclass, so the
   read-only inspection was rerun with `dataclasses.asdict`. Source was not changed.
4. The Windows sandbox helper intermittently denied one patch; the same scoped relative patch was
   retried successfully.
5. No frontend renderer contract exists, so compatibility was not guessed.

### Formal BE0 exit-gate assessment

| Requirement | Result | Evidence / consequence |
|---|---|---|
| Technical characterization | PASSED | 885/885 complete and 20/20 focused. |
| Reproducibility | PASSED | Clean hash locks and exact seed digest. |
| Python 3.11 compatibility | PASSED (Windows x64) | CPython 3.11.15 matches 3.10 behavior/digest. |
| Packaging strategy | SELECTED | Pinned wheel selected; mutable checkout rejected. |
| Packaging artefact/approval | UNRESOLVED | Wheel not built; metadata and approval pending. |
| Response mappings | UNRESOLVED | Four of four need owner decision/frontend contract. |
| Governance approvals | UNRESOLVED | Catalogue, policies, and named sign-off remain open. |
| Permission to begin BE1 engineering | NOT AUTHORIZED | Formal BE0 approval is absent. |
| Pilot/production readiness | NOT READY | Scientific, policy, mapping, packaging gates remain. |

### Final result and exact recommended next task

Technical characterization, reproducibility, and Windows CPython 3.11 compatibility pass. Full BE0
approval does not pass, and BE1 Docker implementation is not authorized.

Exact recommended next task: obtain named Component B owner and academic/research decisions that
(1) resolve all four mappings against an explicit frontend contract, (2) approve the pinned-wheel
strategy and separately authorize building/verifying it with all required packages, (3) approve
catalogue v1.0 or record a governed deferral, and (4) record governed deferrals for every blocked
scientific/session policy. Then re-assess BE0 before authorizing BE1 Docker work.
## BE0 Architecture Correction — Research Generator and Live Application Separation

### Correction scope

This section supersedes only the earlier proposed use of the complete Component B generator wheel
as an application dependency. It preserves the earlier evidence. No BE1 implementation, live
engine package, session behavior, schema, authentication code, BKT runtime, or learner flow was
created.

### Installed-wheel verification result

The already-running isolated installed-wheel test finished and was not rerun or fixed.

```text
Wheel: upadya_component_b_generator-0.1.0+be0.0e86fdc-py3-none-any.whl
Wheel SHA-256: 12b5ba5b7e8a70785a3e2b49e5c07bc8f89cc677c268ea509907f8f6d517e750
Source commit: 0e86fdcbc0ffcdbda3d37c742e83b1d532910e2b
Source manifest SHA-256: fd4f052e41539434ad4ff6bbb72fa01815ef750ceeb0a6d8ebc6fbc481e07e2c
Python: CPython 3.11.15
Import mode: python -I; imports resolved from the clean environment site-packages
Result: 884 passed, 1 failed in 213.14s (0:03:33)
Skipped: 0; warnings: 0
Output SHA-256: 03514e92481b4458cc775d9c1f0ca359ec63eeed97bea4c0680815888895c41c
```

The failure was `test_pilot_report_git_provenance_is_present_and_honest`. In the isolated non-Git
installation, pilot code reported `git provenance unavailable`, while the test additionally expected
the literal word `not`. This is an offline pilot provenance-message assertion, not a scientific
formula or live-safe capability failure. Logic was not changed.

The wheel and evidence are retained as `BE0_RESEARCH_REPRODUCIBILITY_ARTIFACT_ONLY`. The wheel is
not approved for the Upadya application container.

### Corrected architecture decision

1. Yass owns synthetic dataset generation and offline research experiments.
2. Upadya owns real learners, attempts, server timing, persistence, BKT state, hints, sequencing,
   and progress.
3. Upadya may reuse only existing deterministic live-safe functions through a reviewed adapter and
   immutable minimal dependency closure.
4. Upadya must never import or execute synthetic/offline modules.
5. The complete research-generator wheel is not an application runtime dependency.

The preferred future package is `upadya-component-b-live-engine`. It belongs to BE3 and was not
built here. It must contain only the reviewed live-safe source closure and necessary shared
models/validators. Formulas must be reused, not copied or rewritten. The inventory is
`backend/provenance/component-b-live-engine-reuse-map.json`.

### Allowed future application reuse

Subject to BE3 minimal packaging, adapters, configuration approval, and architecture tests:

- catalogue validation, checksum, and grade normalization;
- activation and grade eligibility;
- sequencing features, scoring, ranking, and target selection;
- deterministic task construction after removing synthetic import reachability;
- answer normalization/equivalence and place-value parsing;
- distractor construction and exact catalogue hint lookup;
- BKT prediction, posterior, and update;
- Guess-Guard and certification;
- session aggregation after adapting real-attempt DTOs.

No mathematical formula was copied or rewritten.

### Prohibited application code

The application must not install the full research wheel or execute `cohort/*`, hidden learner
truth, synthetic traits, `behaviour.first_attempt`, `behaviour.latency`,
`behaviour.attempt_loop`, simulated answers/timing, `pipeline.py`, `pilot.py`, synthetic audits,
dataset-generation entry points, or experiment runners.

### Infrastructure-only BE1 reassessment

The full wheel is not required for infrastructure-only BE1. Python 3.11 reproduction passed,
unresolved policies are recorded without invented values, production remains fail-closed, and
engine/session behavior remains blocked.

Infrastructure-only BE1 is authorized for Dockerfile, `.dockerignore`, Docker Compose with pinned
Python 3.11 API and official PostgreSQL 16, settings, errors, request IDs, logging, CORS, health,
database connectivity, SQLAlchemy unit-of-work and Alembic foundations, Supabase JWT verification,
and `GET /api/v1/me`.

Not authorized: BE2 session behavior/persistence semantics; BE3 engine packaging/integration; BE4
learning flow; BE5 unresolved renderer integration; runtime-bundle activation; pilot; production.

### Files changed and next task

- `backend/provenance/component-b-baseline.json`
- `backend/provenance/component-b-closure-decisions.json`
- `backend/provenance/component-b-live-engine-reuse-map.json` (new)
- `backend/packaging/component_b_internal/IMPORT_POLICY.md`
- `backend/buildLog.md`

Exact next task: begin infrastructure-only BE1 with the pinned Python 3.11 API Dockerfile,
`.dockerignore`, and Docker Compose foundation using pinned official PostgreSQL 16. Do not install
the research wheel or add session/Component B engine behavior.

Transition result: `INFRASTRUCTURE_ONLY_BE1_AUTHORIZED`.

## Phase BE1 — Batch 1: Docker and PostgreSQL Infrastructure Foundation

### Scope and architecture boundary

Implemented only the authorized BE1 infrastructure foundation: a pinned Python 3.11 API image,
strict build-context exclusions, Docker Compose API/PostgreSQL services, environment template,
settings, CORS, and infrastructure-stage liveness/readiness checks. No session API, persistence
model, migration, authentication, question selection/generation, attempt, hint, BKT, sequencing,
completion, progress, live-engine, Component C, or learner-flow behavior was added.

The full Component B research-generator wheel remains
`BE0_RESEARCH_REPRODUCIBILITY_ARTIFACT_ONLY`. It is neither installed nor mounted in the API
container. The application image contains no Yass source, wheel, provenance directory, research
dataset, pipeline, pilot, synthetic learner code, or experiment runner.

### Files created or updated

- `backend/Dockerfile`
- `backend/.dockerignore`
- `backend/compose.yaml`
- `backend/.env.example`
- `backend/requirements.in`
- `backend/requirements.lock`
- `backend/app/core/config.py`
- `backend/app/main.py`
- `backend/app/api/routes/health.py`
- `backend/tests/test_health.py`
- `backend/buildLog.md` (this append-only section)

### Reproducible inputs and image pins

- API base: `python:3.11.15-slim-bookworm@sha256:b18992999dbe963a45a8a4da40ac2b1975be1a776d939d098c647482bcad5cba`
- Python linux/amd64 manifest observed during pin review:
  `sha256:28255a3ace7eb4c48bc1b57b90af29e1bc82b4fd6c60614a8e3dce61b87ff941`
- Database: `postgres:16.10-bookworm@sha256:38471f330eb885e04de130b768d6db4e10469e2311879c7e5c699f6d2d8a1c74`
- PostgreSQL linux/amd64 manifest observed during pin review:
  `sha256:94f23d40fdaf5e60cb2fd8a98c22f02a7b8724949f310d95a0ddf075e8c8b208`
- Dependency lock SHA-256:
  `4d3c79b8d2266c3ed9e50896ccfb7346dac56e47d5583291874ecae4c6797622`
- Dependency installation uses `pip install --require-hashes --no-deps -r requirements.lock`.
- API runtime Python: `Python 3.11.15`.
- Built API image/tag: `upadya-backend:be1-batch1`.
- Built OCI image/index digest:
  `sha256:d0cb921ba8ab82618546915a5defd02626bda7394ae367c5af710912debd969d`.
- Build output configuration digest:
  `sha256:c036d06fecf204352115c76f52ad59999db88c29aaa4d412b622087a92b1d556`.

The dependency lock was generated with:

```powershell
conda run -n component_b python -m uv pip compile requirements.in --generate-hashes `
  --python-version 3.11 --python-platform x86_64-manylinux_2_28 `
  --no-header --no-annotate --output-file C:\tmp\upadya-backend-requirements.lock
```

The Docker build context was 73.69 kB. The `.dockerignore` excludes secrets/environment files,
Git metadata, caches, virtual/Conda environments, frontend/node artefacts, provenance, packaging,
wheels, research/data/output directories, and build logs. Only the application, tests, and locked
runtime inputs are copied. The API build uses cache-friendly lockfile installation before source
copying.

### Commands executed

```powershell
docker compose config --quiet
docker compose build --no-cache
docker compose up -d
docker compose ps --all
docker compose exec -T api python --version
docker compose exec -T api python -m compileall -q app
docker compose exec -T api python -m pytest -q
docker compose exec -T api id
docker compose exec -T db pg_isready -U upadya -d upadya
curl.exe -fsS http://127.0.0.1:8000/health/live
curl.exe -fsS http://127.0.0.1:8000/health/ready
docker inspect upadya-be1-api-1
docker inspect upadya-be1-db-1
docker history --no-trunc upadya-backend:be1-batch1
docker compose restart db
```

The final shutdown used `docker compose down` without `--volumes`; the named database volume was
intentionally preserved.

### Verification results

- `docker compose config --quiet`: PASS.
- No-cache API build: PASS.
- Containers: `upadya-be1-api-1` and `upadya-be1-db-1`; both reported healthy.
- API exposure: `127.0.0.1:8000`; PostgreSQL host port bindings: none.
- API-to-database hostname: `db`.
- PostgreSQL readiness: `/var/run/postgresql:5432 - accepting connections`.
- API compile check: PASS.
- Container tests: `3 passed` in 0.37 seconds. Warnings were one upstream
  FastAPI/Starlette TestClient deprecation and a non-failing pytest cache warning because the
  runtime image is read-only to UID 10001 under `/app`.
- Runtime identity: `uid=10001(app) gid=10001(app)`; image user is `10001:10001`.
- Liveness: HTTP 200 with `status=alive` and a request ID.
- Readiness: HTTP 200 with `stage=infrastructure`, `api_process=ok`, and `database_tcp=ok`.
  Generator, catalogue, runtime bundle, migrations, and authentication are honestly reported as
  `not_checked`; readiness does not imply scientific or product readiness.
- API mounts: zero. Database mount:
  `upadya-be1-postgres-data -> /var/lib/postgresql/data`.
- Research package check: `upadya-component-b-generator` not installed.
- Container filesystem check: no Yass-named path or `.whl` under `/app`.
- Image history review: no secret values and no research-wheel installation or copy step.
- Logs: normal API health requests and PostgreSQL startup/restart messages; no credential values
  were exposed in the reviewed output.
- Persistence: inserted marker `volume-survives-restart`, restarted only the database container,
  queried the same marker successfully, and observed PostgreSQL skip initialization because the
  existing data directory was retained. PASS.
- Readiness after database restart: HTTP 200. PASS.

### Errors encountered and fixes

1. The first local lockfile copy used an incorrect path relative to the backend working directory.
   The copy failed without changing backend content; it was immediately rerun with the correct
   destination, and the resulting lock checksum was verified.
2. The first host-side health query embedded a PowerShell variable in an outer PowerShell command,
   which expanded it early and produced an empty-pipe parser error. It was replaced by direct
   `curl.exe -fsS` requests; both endpoints returned HTTP 200.
3. Inspecting PostgreSQL by the unqualified local tag failed because Compose retained the
   digest-qualified reference. Inspection by the exact digest succeeded and matched the Compose
   pin.

### Batch decision and exact next task

Result: **PASS — BE1 Batch 1 infrastructure foundation is complete.**

This does not authorize sessions, database domain tables, migrations for learner behavior,
authentication implementation, scientific runtime integration, pilot use, or production use.

Exact next task: begin BE1 Batch 2 infrastructure-only foundations for stable errors, structured
logging/request-ID integration, database connectivity, SQLAlchemy unit-of-work scaffolding, and
Alembic scaffolding. Keep domain/session tables and migrations, authentication, `/api/v1/me`, the
Component B live engine, learner flows, pilot, and production outside that batch unless separately
authorized.

## Phase BE1 — Batch 2: Errors, Logging, Database and Migration Foundations

### Scope and decisions

Implemented only the authorized BE1 infrastructure: versioned safe errors, bounded request IDs,
JSON structured request logging, SQLAlchemy 2 async PostgreSQL connectivity, async session
lifecycle, an infrastructure-only unit of work, and async Alembic scaffolding. No authentication,
`/api/v1/me`, learner/session/attempt/question/mastery/progress model, repository, business table,
scientific runtime, Component B engine, Component C/3, pilot, or production behavior was added.

The error envelope is version `1.0` and contains a stable code, user-safe message, request ID, and
optional structured details. It deliberately omits a timestamp because errors do not require one;
operational timestamps belong in logs. Central handlers cover application, validation,
authentication-shaped, not-found, conflict, service-unavailable, and unexpected errors. Raw
exceptions, stack traces, SQL, paths, and credentials are not returned.

Incoming `X-Request-ID` values are accepted only when they match a conservative 1–64 character
allowlist; all other values are replaced with a UUID. A ContextVar carries the ID into logs.
Uvicorn raw access logs are disabled, and application logs use route templates rather than raw URLs
to avoid recording identifiers. No headers, request bodies, learner answers, tokens, passwords, or
database URLs are logged.

Readiness now performs SQLAlchemy `SELECT 1` through asyncpg. It honestly leaves migrations,
authentication, catalogue, generator, runtime bundle, and higher-level behavior as `not_checked`.
Engine disposal runs during application shutdown. SQLite is rejected rather than used as fallback.

The Alembic revision `20260722_0001` is an intentionally empty infrastructure baseline. Alembic
reads the application `DATABASE_URL`; no credential is committed in the migration configuration.
Migration commands run inside the API container as documented in `migrations/README.md`.

### Files created

- `backend/app/core/errors.py`
- `backend/app/core/logging.py`
- `backend/app/core/request_context.py`
- `backend/app/application/unit_of_work.py`
- `backend/app/infrastructure/database.py`
- `backend/app/infrastructure/unit_of_work.py`
- `backend/alembic.ini`
- `backend/migrations/env.py`
- `backend/migrations/script.py.mako`
- `backend/migrations/README.md`
- `backend/migrations/versions/20260722_0001_empty_infrastructure_baseline.py`
- `backend/pytest.ini`
- `backend/tests/test_errors_and_request_ids.py`
- `backend/tests/test_database_and_uow.py`

### Files changed

- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/app/api/routes/health.py`
- `backend/tests/test_health.py`
- `backend/requirements.in`
- `backend/requirements.lock`
- `backend/Dockerfile`
- `backend/compose.yaml`
- `backend/buildLog.md`

### Dependencies and artefacts

- SQLAlchemy `2.0.46` with asyncio support
- asyncpg `0.31.0`
- Alembic `1.18.4`
- Existing pins retained: FastAPI `0.137.1`, Uvicorn `0.49.0`, httpx `0.28.1`, pytest `9.1.1`
- Lock generated for CPython 3.11 / x86_64 manylinux with hashes and 33 resolved packages
- `requirements.lock` SHA-256:
  `d6ef4408a902e2aa7a2d2c63474cbea2715ace9bf9e1e00f3e171e12d85059ad`
- Final image: `upadya-backend:be1-batch2`
- Final image/index digest:
  `sha256:ef5503a329711fdb119d1386602ae6b661991ad538219caf7e2b85f19d2429fd`
- Runtime Python: `3.11.15`; runtime identity: UID/GID `10001:10001`

### Commands and verification

```powershell
conda run -n component_b python -m uv pip compile requirements.in --generate-hashes `
  --python-version 3.11 --python-platform x86_64-manylinux_2_28 `
  --no-header --no-annotate --output-file requirements.lock
docker compose config --quiet
docker compose build --no-cache
docker compose up -d --force-recreate
docker compose ps
docker compose exec -T api python --version
docker compose exec -T api python -m compileall -q app migrations
docker compose exec -T api python -m pytest -q
docker compose exec -T api alembic current
docker compose exec -T api alembic upgrade head
docker compose exec -T api alembic downgrade base
docker compose exec -T api alembic upgrade head
docker compose exec -T db pg_isready -U upadya -d upadya
```

Final results:

- Compose validation and clean no-cache build: PASS.
- Both containers healthy; API bound to `127.0.0.1:8000`; database host port bindings `{}`.
- Compile: PASS.
- Tests: `12 passed, 1 warning in 0.46s`. The warning is the upstream FastAPI TestClient notice
  that Starlette's current `httpx` integration is deprecated.
- Request IDs: valid incoming IDs preserved on success and errors; unsafe/overlong values replaced;
  every tested response contains `X-Request-ID`; error body ID matches header. PASS.
- Stable errors: not-found, conflict, authentication-shaped, validation, database unavailable, and
  unexpected internal errors covered; internal exception text is absent from responses. PASS.
- Structured logging: JSON request-start, completion, and exception events tested. Runtime logs
  include timestamp, level, logger, event, request ID, method, route template, status, duration,
  version, and environment. The runtime evidence correlated `final-client-123` and
  `final-error-123`. PASS.
- Database connectivity: async SQLAlchemy/asyncpg readiness `SELECT 1` succeeded; PostgreSQL
  `pg_isready` accepted connections. PASS.
- Unit of work: commit, rollback-on-failure, and close behavior tested; `3` lifecycle/database URL
  tests are part of the 12-test result. PASS.
- Migrations: current → upgrade head → downgrade base → upgrade head completed transactionally on
  PostgreSQL; final revision is `20260722_0001 (head)`. PASS.
- Schema inspection found `alembic_version` plus `be1_persistence_check`. The latter is the
  pre-existing Batch 1 named-volume persistence marker. Batch 2 created only Alembic's
  infrastructure version table and no business/domain table.
- API container: non-root, zero mounts, healthy. Research generator package not installed; no Yass
  path or wheel found under `/app`. PASS.
- Reviewed responses and JSON application logs contain no secrets, database URL, authorization
  header, learner data, raw exception, SQL, or internal path.

### Errors, causes, and fixes

1. A pre-container local pytest attempt used the research `component_b` Conda environment, which
   intentionally lacks FastAPI and SQLAlchemy. Collection failed for missing packages. No package
   was installed into that research environment; authoritative tests ran in the locked API image.
2. The first container run produced `11 passed, 1 failed`: Starlette's unmatched-route exception is
   its base `HTTPException`, while the handler was registered for FastAPI's subclass. Registering
   the centralized handler for Starlette's base type fixed the not-found contract. Final result:
   12 passed.
3. The first non-root test run warned that `/app/.pytest_cache` was not writable. `pytest.ini` now
   places cache data under `/tmp`; the final run has no cache warning.
4. Final logging review identified that raw paths could eventually contain learner identifiers.
   Logging was hardened to route templates, Uvicorn access logging was disabled, and a final clean
   no-cache image was built and retested.

### Limitations, blockers, and next task

This batch supplies infrastructure only. It does not make authentication, sessions, catalogue,
Component B engine, BKT, runtime bundle, learner flow, pilot, or production ready. Migration status
is intentionally not asserted by `/health/ready` until a separately reviewed honest mechanism is
implemented. The test-only infrastructure routes exist only when the test modules are imported and
are not part of normal application startup.

Result: **PASS — BE1 Batch 2 is complete.**

Recommended next task: separately authorize BE1 Batch 3 for Supabase JWT verification foundations
and `GET /api/v1/me`, using the stable error, request-ID, logging, database, and migration
infrastructure completed here. Do not add sessions, learner business tables, scientific runtime,
pilot, or production behavior in that task.
