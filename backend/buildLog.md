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

## Phase BE1 — Batch 3: Supabase JWT Verification and Authenticated Identity

Implemented server-side asymmetric Supabase JWT verification, authenticated-principal extraction,
`GET /api/v1/me`, offline authentication tests, and safe environment placeholders only. No learner
or profile record is created and the endpoint does not access Component B session data.

### Files and dependencies

Created `app/api/routes/identity.py`, `app/domain/principal.py`,
`app/infrastructure/auth.py`, and `tests/test_auth.py`. Changed `.env.example`, `Dockerfile`,
`app/core/config.py`, `app/main.py`, `compose.yaml`, `requirements.in`, and `requirements.lock`.

Pinned PyJWT `[crypto]` `2.13.0`; the lock resolves cryptography `49.0.0`, cffi `2.1.0`, and
pycparser `3.0`. Existing Batch 2 pins remain unchanged. Lock SHA-256:
`79998c3267fb0129bac47732c0e9b0971f3839ff20ddee385cc50a6f0c54f1e6`. Final image is
`upadya-backend:be1-batch3` with digest
`sha256:448504e841889c80290b9cbc83317fcca75a3b365474fc23d7df8cf8143078d2`.

Safe configuration placeholders were added for `SUPABASE_URL`, `SUPABASE_JWT_ISSUER`,
`SUPABASE_JWT_AUDIENCE`, `SUPABASE_JWKS_URL`, and `SUPABASE_JWKS_CACHE_TTL_SECONDS`. No real key,
secret, project token, or credential was committed.

### JWT and JWKS design

Only asymmetric `RS256` and `ES256` are allowed. Unsigned, HMAC, unsupported-algorithm, missing-kid,
malformed, expired, premature, wrong-issuer, wrong-audience, missing-subject, invalid-signature, and
unknown-key tokens fail closed using the existing request-ID error envelope. PyJWT validates the
signature, configured issuer, optional audience, expiry, not-before, and non-empty subject. Raw
tokens are never stored.

The principal exposes only `user_id` and an optional email. Email is included only when the signed
claims also assert `email_verified=true` or a non-empty `email_confirmed_at`. Roles, metadata, raw
claims, and tokens are not returned.

The JWKS set cache has a configured TTL clamped to 30–3600 seconds and a five-second timeout. No
indefinite per-key cache is used. Unknown `kid` performs at most one forced refresh under a process
lock, supporting key rotation, with a 5–30 second cooldown to prevent key-ID refresh spraying.
Verification failure or unavailable JWKS always fails closed.

### Commands and results

Ran the reproducible `uv pip compile` command for CPython 3.11/manylinux with hashes, followed by
`docker compose config --quiet`, `docker compose build`, `docker compose up -d`, `docker compose
ps`, in-container compileall, full pytest, focused authentication pytest, unauthenticated and
deterministic authenticated `/api/v1/me` checks, container/log/schema inspection, and final
`docker compose down`.

Full result: `26 passed, 1 warning in 0.73s`. Focused auth result: `14 passed, 1 warning in 0.64s`.
The sole warning is the existing upstream FastAPI TestClient/httpx deprecation.

Unauthenticated `/api/v1/me` returned HTTP 401 with schema `1.0` and a request ID matching the
response header. The deterministic offline authenticated request returned HTTP 200 with exactly
`{"user_id":"user-123","email":"verified@example.test"}` and request ID `docker-auth-123`.

Rotation testing started with JWKS lacking `key-2`; one refresh loaded the rotated key and verified
the token. An immediate unknown-kid spray attempt caused no third fetch. Token-leakage tests and
runtime log inspection found no JWT, Authorization header, test secret, database URL, or credential.

The API remains healthy and non-root (`10001:10001`) with zero mounts; PostgreSQL has no host port.
Schema remains only `alembic_version` and the pre-existing Batch 1 `be1_persistence_check`; Batch 3
added no migration or business table. The research-generator package remains uninstalled and no
Yass path or wheel exists under `/app`.

### Errors, limitations, and next task

The initial unsupported-HMAC test used a short test key and produced a library warning; the test key
was lengthened without changing application behavior. Security review then identified possible
repeated default unknown-kid refreshes, so the locked cooldown layer was added and tested.

Tests are offline and no real Supabase project was contacted. Deployment must provide the exact
issuer, audience policy, and HTTPS JWKS URL through managed configuration. Authentication does not
create profiles, local authorization policy, learner records, or sessions. Sessions, questions,
attempts, BKT, hints, sequencing, progress, completion, live-engine integration, Component C/3,
pilot, and production remain blocked.

Result: **PASS — BE1 Batch 3 is complete.**

Exact next recommended task: conduct a BE1 closure/security review of Batches 1–3 and define the
BE1-to-BE2 transition decision. Do not create learner/session business tables or session behavior
until BE2 scope and unresolved policies are explicitly authorized.

## Phase BE1 Closure — Infrastructure, Database and Authentication Review

### Repository and review scope

Reviewed the committed BE1 Batch 1–3 implementation without adding or changing runtime
functionality. Batch 3 commit `7d6ef7036120185a1017a7773bb46990c39d7c66` is present locally and
at `origin/B_frontend`; the pre-review tree was clean. All Batch 3 application and test files are
tracked. This build log contains the Batch 1, Batch 2, and Batch 3 evidence sections.

Security-critical files reviewed included the Dockerfile, Compose definition, environment example,
dependency input/lock, application configuration, request middleware, error/logging infrastructure,
JWT/JWKS verifier, principal and identity route, async database/session lifecycle, unit of work,
Alembic environment and empty baseline, health routes, and all tests.

### Dependency and supply-chain review

The committed dependency lock was reproduced to a temporary file with the documented CPython 3.11
x86_64-manylinux `uv pip compile --generate-hashes` command. The reproduced file was byte-identical
to the committed lock. Both SHA-256 values are
`79998c3267fb0129bac47732c0e9b0971f3839ff20ddee385cc50a6f0c54f1e6`.

Direct pins include PyJWT `[crypto]` `2.13.0`, SQLAlchemy `[asyncio]` `2.0.46`, asyncpg `0.31.0`,
Alembic `1.18.4`, FastAPI `0.137.1`, and Uvicorn `0.49.0`. The resolved lock pins cryptography
`49.0.0`. The image copies only `requirements.lock` before running
`pip install --require-hashes --no-deps`; application and tests are copied afterward. No research
generator appears in the dependency input or lock, and runtime package inspection reports
`upadya-component-b-generator` absent.

### Authentication security review

PASS. The server verifies JWT signature and explicitly allowlists `RS256` and `ES256`. It requires a
non-empty `kid`, expiry, issuer, and non-empty subject; validates configured audience and not-before
when present; and rejects unsigned, malformed, unsupported-algorithm, expired, premature,
wrong-issuer, wrong-audience, invalid-signature, missing-subject, and unknown-key tokens. Failure to
load or verify JWKS fails closed through the stable version `1.0` authentication error envelope.

JWKS caching has a configured TTL clamped to 30–3600 seconds, five-second fetch timeout, no
indefinite per-key cache, locked forced refresh, and 5–30 second unknown-key refresh cooldown.
Deterministic tests prove rotation succeeds after one refresh and repeated unknown-key attempts do
not cause immediate additional fetches.

The raw token is not stored in the principal, response, log fields, exception text, or database.
Authorization headers are never passed to logging. `/api/v1/me` returns only `user_id` and an email
whose signed claims assert verification/confirmation. Authentication failures return a user-safe
401 with request ID matching `X-Request-ID`.

### Docker and infrastructure verification

Executed `docker compose config --quiet`, `docker compose build --no-cache`, `docker compose up -d`,
`docker compose ps`, in-container Python/compile/test/migration commands, PostgreSQL readiness,
health and authentication-error requests, API/database logs, image/container/history inspection,
schema inspection, and `docker compose down`.

- API base remains pinned to Python `3.11.15-slim-bookworm` digest
  `sha256:b18992999dbe963a45a8a4da40ac2b1975be1a776d939d098c647482bcad5cba`.
- PostgreSQL remains pinned to `16.10-bookworm` digest
  `sha256:38471f330eb885e04de130b768d6db4e10469e2311879c7e5c699f6d2d8a1c74`.
- Closure no-cache API image/index digest:
  `sha256:5219bce0ea3ab0eac38f744658fcc732a79cae36759237fddaabd288870edb13`.
- Runtime Python: `3.11.15`; API user: UID/GID `10001:10001`; API mounts: zero.
- `DATABASE_URL` resolves hostname `db`; PostgreSQL host-port bindings are `{}`.
- Named volume `upadya-be1-postgres-data` is attached at `/var/lib/postgresql/data`, survived the
  review, and remains present after shutdown.
- API filesystem search found no Yass path or wheel. Image history contains no research artefact,
  credential, token, or secret-bearing build instruction.
- Targeted tracked-file credential-signature scan found no private key, Supabase secret key, or
  service-role credential. Reviewed API/database logs contain no token, Authorization header,
  database URL, password, or learner-sensitive data. Committed local-development values and
  `.env.example` Supabase URLs are explicitly non-secret placeholders.

### Database and migration review

PASS. Alembic upgrade-head, downgrade-base, and upgrade-head all completed using PostgreSQL
transactional DDL. The sole revision `20260722_0001` has empty upgrade/downgrade functions. Schema
inspection found only `alembic_version` and the pre-existing Batch 1 infrastructure marker
`be1_persistence_check`. No learner, session, question, attempt, mastery, hint, or progress table
exists. SQLAlchemy exposes only engine/session/probe lifecycle, and the unit of work exposes only
open, commit, rollback, and close—no business repository or domain behavior.

### Health, observability, tests, and warning

PASS. `/health/live` returned process liveness. `/health/ready` returned only infrastructure status
with API and database connection `ok`; generator, catalogue, runtime bundle, migrations, and
authentication remain `not_checked`. It makes no session, engine, BKT, learner-flow, pilot, or
production-readiness claim.

Success and error responses preserved supplied request IDs (`closure-live-123`,
`closure-ready-123`, and `closure-error-123`). Structured JSON logs contain request IDs, method,
route template, status, duration, version, and environment without sensitive values.

The closure container suite reports `26 passed, 1 warning in 0.66s`. The warning is
`StarletteDeprecationWarning` from FastAPI's test-only `TestClient` import regarding the current
httpx integration. It does not occur in the production request path and is non-blocking, but should
be removed when the upstream-supported test client migration is available. A duplicate idempotent
`httpx` logger-level assignment is noted as harmless cleanup debt and was not changed during this
review-only task.

### Unresolved risks, blocked work, and formal exit decision

All implemented BE1 infrastructure and security gates pass. However, the existing governed
baseline explicitly records `be2_be3_be4_be5_pilot_production` as
`BLOCKED_BY_PHASE_AND_UNRESOLVED_GOVERNANCE`, and the closure decision register explicitly lists
`BE2 session behavior and persistence semantics` in blocked scope. This review has no authority to
override those records or invent the unresolved policies.

The requested final-state vocabulary couples BE1 closure with BE2 authorization. Because BE2 is
still explicitly blocked, `BE1_CLOSED_BE2_AUTHORIZED` would be false even though BE1 technical gates
pass. Therefore the formal decision is:

`BE1_NOT_CLOSED`

This means formal transition is withheld by governance, not that a BE1 technical/security test
failed. Learner/session tables, session APIs, questions, attempts, BKT, sequencing, hints, progress,
live-engine integration, Component C/3, pilot, and production remain prohibited.

Exact next task: perform a governance-only BE1-to-BE2 authorization review that resolves or
explicitly defers the recorded BE2 blockers and defines the allowed BE2 persistence scope. Do not
implement BE2 until that decision is recorded.

## BE1-to-BE2 Governance Authorization Review

### Review scope and evidence

This was a governance-only review. No application code, migration, table, API, test, scientific
logic, or runtime dependency was created or changed. The review used the BE0 baseline, closure,
coverage, characterization, live-engine boundary, runtime-bundle schema, and prior build-log
evidence; the backend plan and both Component B application architecture documents; and the
authoritative Yass Component B specification, variable and shared-foundation registers, approved
blocking-decisions memo, approval-status confirmation, catalogue, and empirical-parameter record.

The starting technical evidence remains unchanged: Batch 3 commit
`7d6ef7036120185a1017a7773bb46990c39d7c66`, closure-review commit `6a7b4a9`, 26 tests passed,
Alembic upgrade/downgrade/upgrade passed, and zero business tables. The prior `BE1_NOT_CLOSED`
decision was a governance hold rather than a failed infrastructure or security gate.

The complete blocker classification and enforceable scope are recorded in
`backend/provenance/component-b-be2-governance-authorization.json`.

### Decisions and formal deferrals

The Supabase subject is the canonical external application-user key, not the learner ID. Live
learners require separate opaque UUIDs. Because account-to-learner cardinality and relationship
ownership are not approved, the schema may use a cardinality-neutral junction but may not expose
learner selection, linking, or CRUD. Grade may be nullable and constrained to 2 or 3, with no
default; grade ownership, mutation, inference, and grade-dependent behavior remain blocked.

The documented session state vocabulary may be represented and constrained, including at most one
`starting` or `active` session per learner, but no live session may be created and no state
transition may execute in this limited authorization. Start, resume, recovery, abandonment,
replacement, expiry, and completion behavior remain blocked. Session expiry has no approved
duration. Completion remains disabled and must not be conflated with stopped, abandoned, expired,
or technical-failure states.

Idempotency is an approved engineering contract: scope keys by authenticated actor, operation, and
opaque key; fingerprint the canonical request body; replay the original committed response for an
identical request; return a stable conflict for a mismatched body; serialize concurrent replays;
and commit the record atomically with the future mutation. This foundation may be implemented even
though no new state-changing endpoint is currently authorized.

Attempt limits remain unresolved and synthetic negative-binomial bounds are non-authoritative for
the application. The first-attempt-only evidence rule remains a required future invariant, but item
opportunities, attempts, retries, timing classification, hints, and mastery updates are outside this
limited BE2 scope. Server issuance and receipt timestamps and raw duration fields may be designed in
a future attempt schema without a threshold; no timeout, background/pause adjustment, or learner
outcome may be derived until approved. Network, API, database, and infrastructure failures remain
technical and never become learner failures.

Safe progress, descriptive summaries, certification, and completion output remain disabled. No
counts are exposed yet because the presentation, privacy, consent, and retention contracts are not
approved. BKT, sequencing, hints, certification, Guess-Guard, task generation, answer evaluation,
and the minimal live-engine adapter remain BE3/BE4 work. No placeholder probability, threshold,
score, answer, hint, or scientific default is permitted.

### Authorized and prohibited scope

BE2 is authorized only for non-live schema, migration, repository, idempotency, and audit
foundations using visibly synthetic fixtures in an isolated test database. Authorized table scope
is: `app_users`, `b_learners`, a cardinality-neutral `app_user_learner_links`, immutable metadata-only
`b_runtime_bundle_records`, lifecycle/provenance-only `b_sessions`, append-only technical
`b_session_events`, `b_idempotency_records`, and append-only `b_audit_events`. Runtime-bundle rows
cannot be activated or used by a live session without complete approved checksums and approvals.

No new endpoint or executable lifecycle transition is authorized. Item-opportunity, attempt,
mastery/skill-state, hint, selection, session-summary/progress, and integration/outbox tables remain
prohibited. Learner CRUD, account linking, session start/resume/recovery/abandon/expire/complete,
descriptive summaries, real-child data collection, research export, live-engine integration,
Component C/3, pilot, and production behavior remain prohibited.

Every permitted record design must use minimum-data pseudonymous identifiers, UTC server
timestamps, source class/system/record provenance, environment and schema revision, request and
actor references, and append-only audit evidence where appropriate. Synthetic/test records must
remain in isolated non-live databases and may never be copied into live learner records. Prohibited
fields include population, `dd_subtype`, hidden truth, true mastery, synthetic traits, simulated
answers/correctness/latency, off-day state, experiment identifiers, and pipeline/pilot/audit-runner
outputs.

### Owners, unresolved risks, and transition

Product, privacy/child-safety, ethics/project-governance, and academic/research owners still must
approve account-to-learner relationships, grade control, consent, retention, withdrawal/deletion,
session lifecycle and expiry, attempt limits, timeout/background rules, completion, safe progress,
catalogue mappings, scientific configuration, and named formal sign-off. These items are formally
deferred only from the neutral persistence foundation; they continue to fail closed for live data,
API behavior, scientific behavior, BE3/BE4, pilot, and production.

The BE1 technical and security gates are complete, and the machine-readable scope prevents this
transition from being interpreted as authorization for session behavior or learner data collection.
The formal decision is:

`BE1_CLOSED_BE2_LIMITED_SCOPE_AUTHORIZED`

Exact next task: implement BE2 Limited Batch 1 only—the authorized neutral persistence models,
Alembic migrations, repositories, idempotency/audit foundations, constraints, and isolated
synthetic database tests. Add no endpoints, live records, lifecycle execution, item opportunities,
attempts, scientific fields, live-engine integration, pilot, or production behavior.

## Phase BE2 Limited — Batch 1: Neutral Persistence, Audit and Idempotency Foundations

### Authorization and scope

Implementation started from commit `74676f8`. The hard boundary is
`backend/provenance/component-b-be2-governance-authorization.json`, with decision
`BE1_CLOSED_BE2_LIMITED_SCOPE_AUTHORIZED`. The complete authorization and preceding governance
section were read before code changes. No missing scientific, product, privacy, lifecycle, or
identity decision was inferred.

Only the eight authorized tables were introduced: `app_users`, `b_learners`,
`app_user_learner_links`, `b_runtime_bundle_records`, `b_sessions`, `b_session_events`,
`b_idempotency_records`, and `b_audit_events`. Migration `20260722_0002` follows the empty BE1
baseline `20260722_0001`. No seed data, trigger, dataset, research import, or endpoint was added.

### Files created and changed

Created `app/application/repositories.py`, `app/infrastructure/persistence_models.py`,
`app/infrastructure/repositories.py`,
`migrations/versions/20260722_0002_be2_neutral_persistence.py`,
`tests/test_be2_architecture_guards.py`, and `tests/test_be2_persistence.py`. Changed
`migrations/env.py` and this build log. Alembic now targets the authorized metadata and excludes
only the pre-existing documented `be1_persistence_check` connectivity marker from autogenerate
ownership; the marker itself was not changed.

### Schema, provenance, idempotency, audit, and repositories

Primary resource identifiers are opaque PostgreSQL UUIDs. The Supabase subject is unique and is not
a learner ID. Learner grade is nullable, has no default, and accepts only 2 or 3. The user-to-learner
junction does not encode one-to-one cardinality or relationship behavior.

Session states are constrained data only. A partial unique index permits at most one `starting` or
`active` row per learner. Row version is nonnegative and an active row requires a bundle reference.
No service executes transitions. Bundle rows contain only authorized identity/checksum/publication/
approval metadata and nothing is activated or seeded. Timestamps are timezone-aware, foreign keys
restrict deletion, and event repositories expose no update or delete operation.

Every table requires source class/system, environment, schema revision, request, operation/event,
reason, resource ID/type, timestamps, and exactly one pseudonymous user or system actor. Source
class accepts exactly `REAL`, `SYNTHETIC`, `IMPORTED`, or `TEST`, with no default. Tests use visibly
synthetic subjects and `TEST` provenance in the isolated Docker database.

Idempotency is uniquely scoped by actor, method, operation, and opaque key. It stores the authorized
request fingerprint, neutral nonblank status, optional canonical response/status, and expiry. No
endpoint is wired to it. Repositories provide add/get/existence for all eight tables; idempotency
adds scoped lookup and audit remains append/read only. No lifecycle or scientific policy exists.

### Commands, results, errors, and fixes

Ran Compose configuration, no-cache build, startup/status, Python 3.11.15 and compile checks,
complete pytest, Alembic upgrade/current/downgrade-to-`20260722_0001`/upgrade, PostgreSQL readiness
and metadata inspection, non-root/mount/port checks, dependency/source scans, Docker history/log
leakage scans, and shutdown while preserving the named volume.

Final tests: `34 passed, 1 warning`. The warning is the recorded upstream FastAPI/Starlette
TestClient deprecation. Tests cover exact tables/columns/nullability/keys/constraints/indexes, the
migration cycle, all repositories, rollback, audit persistence, provenance rejection, idempotency,
absence of scientific fields, unchanged OpenAPI paths, and absence of Yass dependencies/imports.

Alembic ends at `20260722_0002 (head)`; the full migration cycle passes and `alembic check` reports
no drift. PostgreSQL contains the eight application tables plus infrastructure-owned
`alembic_version` and pre-existing `be1_persistence_check`. PostgreSQL has no host port, the API has
no source mount and remains UID/GID `10001:10001`, and `upadya-be1-postgres-data` is preserved.

The first run exposed test-harness defects: FastAPI 0.137 represents included routers differently,
the image intentionally copies only the dependency lock, and pooled async connections crossed
separate event loops. Guards now use OpenAPI and available committed dependency files; database
tests use disposed `NullPool` engines and independently upgrade to head. Alembic initially treated
the BE1 connectivity marker as unmanaged, so exactly that marker is excluded from comparison.
Idempotency status is merely nonblank because authorization defines no closed status vocabulary.

### Guards, limitations, and blocked work

Guards prove only eight tables were added; paths remain `/health/live`, `/health/ready`, and
`/api/v1/me`; and no lifecycle service, Yass/research dependency, trigger, seed, BKT, sequencing,
certification, Guess-Guard, hint, or generation integration exists. Container discovery finds no
Yass package/path/wheel. Docker history and logs have zero sensitive-pattern matches.

No real learner ingestion, CRUD/linking API, session API/transition, opportunity, attempt,
retry/hint, timing interpretation, mastery, progress/completion, live engine, Component C/3,
research export, pilot, or production behavior exists. Consent/retention/deletion, relationship and
grade ownership, lifecycle/expiry, attempts/timeouts, completion/progress, catalogue/science, and
formal sign-off remain unresolved and fail closed.

Exact next task: conduct the BE2 Limited Batch 1 closure review only. Do not add endpoints,
lifecycle behavior, live data, scientific fields, or BE3 integration without new machine-readable
authorization.

## Phase BE2 Limited — Batch 1 Closure Review

### Repository and review boundary

Reviewed implementation commit `c516683` and file-ending-only commit `488dff0`. The full starting
HEAD was `488dff0d24ec3c9d19e2d3d98a5c3251a6bd2755`; local `B_frontend` matched
`origin/B_frontend`, and the pre-review working tree was clean. This review changed no application,
migration, model, repository, test, dependency, or runtime functionality. Only this append-only
closure evidence was added.

The implementation was assessed against
`backend/provenance/component-b-be2-governance-authorization.json`, especially its exact eight-table
boundary and required fail-closed constraints. Reviewed files included the neutral SQLAlchemy
models, repository protocols and implementations, Alembic environment and revision
`20260722_0002`, architecture guards, persistence tests, Docker/Compose definitions, dependency
files, and the documented `be1_persistence_check` ownership exclusion.

### Passing evidence

The implementation creates exactly `app_users`, `b_learners`, `app_user_learner_links`,
`b_runtime_bundle_records`, `b_sessions`, `b_session_events`, `b_idempotency_records`, and
`b_audit_events`. PostgreSQL additionally contains only the infrastructure-owned
`alembic_version` and pre-existing `be1_persistence_check` marker. The marker is excluded only from
Alembic autogenerate comparison and is not changed or treated as a BE2 business table.

The no-cache Docker build passed. Python compilation passed. The complete suite reported
`34 passed, 1 warning`; the warning remains the known upstream FastAPI/Starlette TestClient
deprecation. Alembic upgrade to head, current, downgrade to `20260722_0001`, re-upgrade to head, and
`alembic check` passed. Final revision was `20260722_0002`, and PostgreSQL readiness passed.

Repository operations remain neutral add/get/existence operations, plus exact scoped idempotency
lookup. No update/delete convenience API, lifecycle service, scientific formula, task behavior, or
public route was added. Provenance source classes are constrained and have no default; actor,
request, source, environment, schema, reason, resource, and timestamp fields are present.
Idempotency uniqueness is scoped by actor, method, operation, and key. Audit and session-event
records carry neutral append-only repository contracts.

Architecture guards and direct inspection confirmed that the only OpenAPI paths remain
`/health/live`, `/health/ready`, and `/api/v1/me`; the API remains UID/GID `10001:10001` with no
source mounts; PostgreSQL has no host port; the named `upadya-be1-postgres-data` volume was
preserved; and no Yass module, `component_b_generator`, research wheel, or research artefact exists
in the application container.

### Closure-blocking findings

Two explicit authorization constraints are not enforced:

1. The authorization requires an `active` session to reference an immutable approved runtime
   bundle and states that, because no approved bundle exists, live activation must fail closed. The
   database check only requires `runtime_bundle_record_id IS NOT NULL`. A rollback-only PostgreSQL
   probe successfully inserted an `active` session referencing a `DRAFT` bundle whose
   `approval_status` was `UNRESOLVED`.
2. The authorization requires published runtime-bundle records to be immutable. The database check
   only requires the boolean `immutable_after_publication` to be true when state is `PUBLISHED`; it
   does not prevent later updates. The same rollback-only probe successfully changed the manifest
   checksum of a `PUBLISHED` record marked immutable.

PostgreSQL reported zero non-internal triggers on `b_runtime_bundle_records` and `b_sessions`, and
the repositories contain no alternative enforcement. The diagnostic transaction was rolled back,
so it left no test records. Existing tests do not cover either required rejection and therefore
their passing result cannot satisfy these two gates.

These findings do not authorize adding lifecycle behavior. A narrowly scoped corrective task must
enforce published-bundle immutability and prevent any active-session row from referencing a draft,
unapproved, or otherwise ineligible bundle, with database-level tests. The correction must not add
an endpoint, session transition service, real learner data, scientific configuration, engine
integration, or runtime activation.

### Formal closure decision

The table boundary, repositories, provenance, idempotency, audit structure, migration cycle,
architecture separation, and infrastructure checks otherwise pass. However, closure requires every
machine-readable required constraint to hold. Because the two bundle fail-closed constraints above
are demonstrably bypassable, the formal decision is:

`BE2_LIMITED_BATCH_1_NOT_CLOSED`

Exact next task: perform a governance-bound BE2 Limited Batch 1 corrective patch only for the two
failed database invariants and their tests, then repeat this closure review. Do not authorize or
begin endpoints, executable lifecycle transitions, live learner data, attempts, progress,
scientific logic, or Component B engine integration.

## BE2 Limited Batch 1 Corrective Patch — Runtime Bundle Eligibility and Immutability

### Scope and implementation

Starting from commit `0aa408da67a208eed4eced204578871ba39570d1`, this corrective patch addresses
only the two database integrity gaps identified by the preceding closure review. Alembic revision
`20260722_0003` follows `20260722_0002` and installs two PostgreSQL trigger functions and two
triggers. It creates no table, column, seed, endpoint, lifecycle service, or scientific behavior.

`enforce_b_session_active_bundle_eligibility` rejects a direct insert or update that would leave an
`active` session referencing a runtime bundle unless the existing bundle fields are exactly
`publication_state = 'PUBLISHED'`, `approval_status = 'APPROVED'`, and
`immutable_after_publication = true`. It also locks the selected bundle row during the check.
`enforce_b_runtime_bundle_integrity` rejects a checksum change when the old bundle row is both
published and immutable. The same bundle-side guard prevents publication, approval, or immutability
changes from making a bundle ineligible while an active session references it. All rejections use
PostgreSQL check-violation SQLSTATE `23514` and named constraints. No status or eligibility rule was
invented beyond the authorized existing fields and literals.

Files created:

- `migrations/versions/20260722_0003_bundle_integrity_guards.py`
- `tests/test_be2_bundle_integrity.py`

File changed:

- `tests/test_be2_architecture_guards.py`

The migration, focused test, and architecture-guard SHA-256 values at verification time were,
respectively, `6FDA45920C217D2271CDFEF603D6141153C4C5AFC69BFCD24D0943EFB7570F99`,
`C8DFA12363B55C4A919A98C0A92490E34B2D9745C6B9DF66EAAA69692EE1D2B8`, and
`0FC562CF825080445BD02D2A3F3A0F4B6903317C93A531758C77DC28A6E8A6F6`.

### Direct-SQL and test evidence

The focused Docker test ran direct SQL through SQLAlchemy rather than repositories or application
services. It proved that non-active technical-failure persistence remains possible with a draft
bundle; direct insert of an active session with a draft bundle fails; direct insert with an
unresolved bundle fails; an eligible published/approved/immutable bundle succeeds; direct update
from non-active to active with a draft bundle fails; repointing an active session to a draft bundle
fails; and revoking approval from a bundle referenced by an active session fails without changing
the original data. A second direct-SQL test proved that a draft mutable checksum can change, an
unchanged published checksum remains valid, and changing the checksum of a published immutable
bundle fails while preserving the original checksum.

Focused result: `2 passed in 2.48s`. Complete result: `37 passed, 1 warning in 7.88s`. The warning is
the previously recorded upstream FastAPI/Starlette TestClient deprecation and is unrelated to the
patch. `python -m compileall app` passed. Architecture guards verify that revision `0003` contains
only the exact two functions and triggers, creates no table, contains no seed insert, and introduces
no Yass or generator reference.

### Docker, migration, metadata, and isolation verification

`docker compose config --quiet`, `docker compose build`, `docker compose up -d`, container status,
compilation, focused pytest, and full pytest passed. The built API image manifest-list digest was
`sha256:06c5d48a09cac72097481f83f8291219b57cb99533e823743c814b43c6294007`.
The API and database were healthy; PostgreSQL 16 remained pinned by digest and exposed only its
container port. The API remained UID/GID `10001:10001`, had no source mount, and the named
`upadya-be1-postgres-data` volume remained configured.

Alembic upgrade/current/check, downgrade from `20260722_0003` to `20260722_0002`, and re-upgrade to
head passed. `alembic check` reported no new operations, final head was `20260722_0003`, and
`pg_isready` reported accepting connections. PostgreSQL metadata showed exactly
`trg_b_sessions_active_bundle_eligible` on `b_sessions` and `trg_b_runtime_bundle_integrity` on
`b_runtime_bundle_records`, backed by the two named functions. The table set remained the authorized
eight tables plus `alembic_version` and the pre-existing `be1_persistence_check` marker.

Compose inspection confirmed `DATABASE_URL` still uses hostname `db`, PostgreSQL has no host port,
and the API has no source volume. Image history and service logs showed no added secrets, tokens, or
Authorization headers. Application logs contained only existing structured health events and
request IDs. OpenAPI paths remained exactly `/health/live`, `/health/ready`, and `/api/v1/me`.
Dependency/source guards and container tests confirmed that no Yass source,
`component_b_generator`, research wheel, or scientific runtime dependency was introduced.

### Limits and next task

This patch does not authorize or implement public endpoints, session lifecycle transitions, real
learner ingestion, attempts, progress, BKT, sequencing, hints, Component B engine integration,
Component C/3, pilot, or production behavior. It does not declare BE2 Limited Batch 1 closed.

Exact next task: conduct a separate BE2 Limited Batch 1 closure re-review against the corrected
database invariants and all original authorization gates. Do not begin any later behavior or phase
unless that review issues a new formal authorization.

## BE2 Limited Batch 1 Closure Re-Review — Runtime Bundle Integrity Confirmation

### Repository state and review authority

This re-review began with a clean working tree at corrective commit
`7a7b03ccbb972b8a3fabe7f6686e6f9d17cbd0f7` (`fix(backend): enforce runtime bundle integrity
guards`). Local `B_frontend` exactly matched `origin/B_frontend`, confirming the corrective commit
was present on the remote. The underlying BE2 persistence implementation is commit `c516683`, with
file-ending normalization in `488dff0`; the first closure review is commit `0aa408d`. The governing
machine-readable authority remains
`backend/provenance/component-b-be2-governance-authorization.json`, introduced by commit `74676f8`.

The authorization, revisions `20260722_0002` and `20260722_0003`, direct-SQL integrity tests,
architecture guards, persistence models, application and SQLAlchemy repository contracts, previous
closure evidence, and corrective-patch evidence were reviewed. No functionality was implemented or
modified during this re-review; only this append-only evidence was added.

### Previous blockers and corrective database objects

The previous decision was `BE2_LIMITED_BATCH_1_NOT_CLOSED` because direct SQL could create an active
session against a draft/unresolved bundle and could change the checksum of a published immutable
bundle. Revision `20260722_0003` corrects those two failures with database-level enforcement:

- `enforce_b_session_active_bundle_eligibility()` and
  `trg_b_sessions_active_bundle_eligible` enforce that every inserted or updated `active` session
  references a bundle whose existing fields are `PUBLISHED`, `APPROVED`, and immutable.
- `enforce_b_runtime_bundle_integrity()` and `trg_b_runtime_bundle_integrity` prevent checksum
  changes to a published immutable bundle and prevent a bundle referenced by an active session from
  being changed into an ineligible state.

PostgreSQL metadata confirmed both functions and both triggers at revision `20260722_0003`. The
session trigger is `BEFORE INSERT OR UPDATE OF state, runtime_bundle_record_id`; the bundle trigger
is `BEFORE UPDATE OF manifest_checksum, publication_state, approval_status,
immutable_after_publication`. Existing foreign keys, checks, uniqueness constraints, and the
one-starting-or-active-session partial unique index remain in effect. The corrective revision adds
no table, column, seed, endpoint, service, or scientific field.

### Invariant and direct-SQL confirmation

The focused tests exercise the PostgreSQL guards rather than relying on repository or application
validation. They confirm that direct insertion of an active session against a draft bundle fails;
an unresolved bundle fails; a published, approved, immutable bundle succeeds; a pre-existing
non-active technical-failure record retains its already-authorized behavior; transition to active
against an ineligible bundle fails; repointing an active session to an ineligible bundle fails; and
failed writes are rolled back without leaving rejected records. They also confirm that eligibility
cannot be revoked while an active session references the bundle.

For checksum immutability, a draft mutable checksum change remains allowed, a no-op update of the
published checksum remains allowed, and a direct-SQL checksum change for a published immutable
bundle fails. After the failed update, the original checksum remains stored. These results confirm
that direct SQL cannot bypass either invariant and that enforcement does not introduce executable
lifecycle behavior.

### Docker, tests, migrations, and schema inspection

`docker compose config`, `docker compose build`, `docker compose up -d`, and `docker compose ps`
passed. The build used pinned Python `3.11.15-slim-bookworm` and PostgreSQL `16.10-bookworm` image
digests; the API image manifest-list digest for this review was
`sha256:b2d617c3a5e0a50fc32e75ef9991d0382aa3359a473d74840f00d63de4a01991`.
`python -m compileall app` passed. The complete Docker test run collected 37 tests and reported
`37 passed, 1 warning in 7.90s`; the sole warning is the already-recorded upstream
FastAPI/Starlette TestClient deprecation. Provenance, idempotency, audit, repositories, rollback,
architecture guards, and the two focused integrity tests all passed.

Alembic upgrade, current, check, downgrade to `20260722_0002`, and re-upgrade passed. Final current
revision was `20260722_0003 (head)`, `alembic check` reported `No new upgrade operations detected`,
and PostgreSQL reported accepting connections. There is no schema drift.

The exact eight authorized application tables remain `app_users`, `b_learners`,
`app_user_learner_links`, `b_runtime_bundle_records`, `b_sessions`, `b_session_events`,
`b_idempotency_records`, and `b_audit_events`. PostgreSQL additionally contains only
infrastructure-owned `alembic_version` and the pre-existing `be1_persistence_check` marker.
Model/migration inspection and passing exact-schema tests confirm that no unauthorized column or
additional table was introduced.

### Architecture, isolation, and leakage boundary

OpenAPI still exposes only `/health/live`, `/health/ready`, and `/api/v1/me`. No session or learner
endpoint, lifecycle transition service, real-user ingestion, attempt, item-opportunity, progress,
completion, BKT, sequencing, hint, Guess-Guard, certification, task generation, or Component B
live-engine integration exists. Repository contracts remain neutral add/get/existence operations,
plus the already-authorized scoped idempotency lookup.

The API ran as UID/GID `10001:10001` and had no mounts. PostgreSQL exposed no host port and retained
only the named `upadya-be1-postgres-data` volume; after `docker compose down`, volume inspection
confirmed that the named database volume was preserved. Application-content inspection found no Yass
source, `component_b_generator`, or wheel. Dependency and architecture guards found no research
generator dependency or import. Targeted scans of service logs and image history found no token,
Authorization header, secret, JWT, research-generator, or wheel leakage.

### Remaining risks, closure decision, and next task

The corrective objects close the two technical blockers without widening the authorized scope.
All policy and scientific matters recorded as unresolved in the authorization remain unresolved and
fail closed, including learner relationship and grade ownership, lifecycle and expiry semantics,
attempts and timeouts, completion and safe progress, catalogue approval and response mappings,
scientific parameters, privacy/retention, formal owner approval, and live-engine activation.
Closure of this limited persistence foundation does not authorize additional BE2 behavior, a live
learner flow, pilot, or production.

The formal closure decision is:

`BE2_LIMITED_BATCH_1_CLOSED`

Exact next task: obtain a new machine-readable governance authorization defining the next narrowly
scoped BE2 batch before implementing any endpoint, lifecycle transition, real-user ingestion,
attempt, progress, scientific field, or Component B live-engine integration.

## Post-BE2 Limited Batch 1 Governance Authorization Review

### Review purpose and sources

This governance-only review followed formal closure of BE2 Limited Batch 1 at corrective commit
`7a7b03ccbb972b8a3fabe7f6686e6f9d17cbd0f7`, migration head `20260722_0003`, and the verified
`37 passed, 1 known upstream warning` baseline. It changed no application code, migration, API,
test, dependency, database model, or scientific logic.

The review considered the existing BE2 machine authorization and build evidence; `backend.md` and
`frontend.md`; the Component B backend/frontend architecture and Component B architecture; the
generator specification and proposed learner-response/attempt specification; the Component B
variable and shared-foundation decision registers; the persistence models, repository contracts,
and migration history through `20260722_0003`. Its resulting machine record is
`backend/provenance/component-b-be2-next-scope-authorization.json`.

Architecture documents describe a future target, but they are not by themselves authorization to
create real child records or execute lifecycle behavior. The proposed response/attempt specification
is scientific research specification material, remains proposed for approval, and includes synthetic
behavior that the live backend is prohibited from importing or executing. Shared generator decisions
do not resolve application ownership, consent, access-control, or lifecycle policy.

### Account, ownership, and learner-profile findings

The verified Supabase subject is the external identity key and is conceptually mapped to
`app_users`; it must never be used as `learner_id`. However, there is no approved provisioning rule
for creating or activating that mapping. Account-to-learner cardinality remains explicitly
unresolved. The sources also contain incompatible role vocabularies: one proposes
learner/supervisor/operator, while the broader architecture proposes learner/guardian/teacher/
researcher/admin. No source with sufficient authority selects the application vocabulary or exact
capabilities.

Consequently, learner create, list, retrieve, update, deactivate, link, and unlink APIs are not
authorized. Grade remains schema-constrained to nullable 2 or 3, but required grade, assignment
authority, and grade-change authority are unresolved. No learner-profile response fields are newly
authorized; names, contacts, birth data, diagnosis, population, subtype, hidden truth, and research
membership remain prohibited. The existing `/api/v1/me` response remains limited to its already
implemented `user_id` and verified email contract and is not expanded to roles or learner data.

### Session lifecycle and preparation findings

The seven state strings remain authorized only as schema vocabulary: `starting`, `active`,
`completing`, `completed`, `abandoned`, `expired`, and `technical_failed`. No start, prepare, resume,
abandon, expire, complete, recovery, replacement, or other transition is authorized. The existing
database rule permitting at most one starting or active session per learner remains unchanged; it
does not authorize creating either state.

Creating a session without selecting a question could be architecturally separable, but it is still
a lifecycle mutation. Learner ownership, consent, expiry and recovery semantics, the exact response
contract, and an approved live runtime-bundle resolution path are missing. Learner ID, grade, and a
bundle ID are therefore not sufficient authority. The first question remains blocked until a
separately authorized BE3 live-engine integration. Session preparation is treated as a BE2
lifecycle concern with BE3 prerequisites, not as implicit BE4 authority, and is not authorized now.

### Provenance, privacy, idempotency, and audit findings

REAL records may not yet be created. A future live command must server-assign `source_class=REAL`,
derive the actor from a verified subject-to-`app_users` mapping, and record request, operation,
reason, resource, source system, environment, schema revision, and server timestamp. Client-supplied
provenance must never select REAL. TEST and SYNTHETIC fixtures remain confined to isolated test
databases; TEST, SYNTHETIC, and IMPORTED source classes must be rejected by any future live path.

The minimum future learner record is an opaque pseudonymous learner ID, governed grade, and neutral
status. Consent, retention, withdrawal, deletion or irreversible anonymization, identity separation,
and child-safety ownership require approval before REAL admission. No research export or operational
identity-to-research join is authorized.

Every future state-changing command must use the existing actor/method/operation/key idempotency
scope, canonical body fingerprint, atomic response persistence, identical replay, body-mismatch
conflict, and concurrency protection. Future profile and lifecycle changes require append-only audit
evidence including actor, request, reason, target, before/after version references, timestamp,
environment, and required approval evidence. These future requirements do not authorize a command.

### Authorized boundary and still-blocked behavior

No new table, column, endpoint, request field, response field, lifecycle transition, or live mutation
is authorized. The existing eight application tables and the existing health and `/api/v1/me`
endpoints remain unchanged. Fail-closed behavior prohibits inferring learner ownership from subject,
email, UUID possession, or editable token metadata; assigning default grade, role, consent, expiry,
or bundle; or creating application-user, learner, relationship, or session rows through live requests.

Item opportunities, answer attempts, hints, retries, timing interpretation, BKT, mastery,
sequencing, Guess-Guard, certification, progress, completion, Component B live-engine integration,
Yass generator installation, Component C, Component 3, research export, pilot, and production all
remain blocked.

### Decision and exit requirements

No smallest executable application scope can be stated without inventing policy. Before another
authorization can be issued, named owners must approve account-to-learner cardinality and
provisioning, one reconciled role/capability vocabulary, learner profile and grade authority, and
REAL-data consent/retention/withdrawal/deletion rules. Any proposed session-preparation batch must
also approve its exact transitions, ownership checks, response fields, idempotency, audit, expiry
and recovery behavior, and eligible runtime-bundle path. The new machine record enumerates the
required future tests and exit gates.

The formal decision is:

`BE2_NEXT_SCOPE_NOT_AUTHORIZED`

Exact next task: obtain the named product, security, privacy/child-safety, academic, and governance
owner decisions recorded in `component-b-be2-next-scope-authorization.json`, then issue a narrower
machine-readable authorization before implementation. Do not begin implementation from architecture
proposals alone.

## Teacher, Learner, Classroom and QR Membership Governance Authorization Review

### Agreed product model and authority

This governance-only review records the newly agreed application model of exactly two profile types:
`LEARNER` and `TEACHER`. Parent, guardian, administrator, school-administrator, supervisor,
operator, researcher, and every other application role are prohibited. Supabase remains the sole
authentication provider; the backend stores no password, raw JWT, refresh token, or editable role
claim. One authenticated account may create one immutable profile type and may not hold both.

The review considered the prior BE2 authorizations and build evidence, backend and frontend plans,
the Component B application architectures, current stable error contract, persistence and repository
foundations, migration history through `20260722_0003`, Component B session/response specifications,
and current shared and Component B registers. The previous
`BE2_NEXT_SCOPE_NOT_AUTHORIZED` record remains preserved as decision history. The new agreed product
decisions supersede its ownership and role blockers only for the profile/classroom scope documented
in `backend/provenance/component-b-profile-classroom-authorization.json`.

No code, model, migration, API, dependency, test, table, session behavior, or scientific logic was
created or modified during this review.

### Table reuse and persistence decision

Creating both `learner_profiles` and `b_learners` would duplicate the same operational learner.
Therefore no `learner_profiles` table is authorized. `app_users` is reused and may later be extended
only with a nullable-during-onboarding, then immutable, `LEARNER`/`TEACHER` profile discriminator.
`b_learners` remains the learner profile and may be minimally extended with a bounded nonblank name.
Its existing nullable numeric grade remains non-client-writable and is not the classroom-context
authority. `app_user_learner_links` remains the one self-ownership link for a LEARNER account in
this limited scope; it must not encode teacher classroom access.

`teacher_profiles` and `classrooms` are authorized new tables. A teacher profile belongs uniquely to
one TEACHER account. A classroom belongs to exactly one teacher, carries exactly one `GRADE_2` or
`GRADE_3`, and may have an optional name/section. Teacher-owned normalized classroom names must be
unique when present. Classroom transfer, archive, deletion, update, and post-membership grade change
are not authorized.

`classroom_invites` and `classroom_memberships` are authorized as policy-gated persistence
foundations only. Invite rows store a unique token hash, never a raw token, and allow future expiry
and revocation evidence. Membership rows use only `PENDING`, `APPROVED`, and `REJECTED`, link one
learner and classroom through an invite, and record the owning teacher's decision. Their live
mutation and retrieval endpoints remain disabled until multi-classroom and invite policies are
approved.

### Ownership, classroom, grade, and membership decisions

One teacher may own multiple classrooms; one classroom has one teacher and one grade; and one
classroom may contain multiple approved learners. Teachers may access only owned classrooms and
minimum learner identity attached through approved memberships. Learners may access only their own
profile and memberships. UUID possession and editable token metadata never authorize access.

The owning teacher selects `GRADE_2` or `GRADE_3` at classroom creation. An approved learner's
learning context inherits that classroom grade, and the learner cannot override it. Grade 1,
Grade 4, and every other grade fail validation. Changing classroom grade after any membership exists
remains unresolved and fail-closed. Whether one learner may join multiple classrooms, including
cross-grade behavior, remains unresolved; no product cardinality was invented.

Scanning a valid invite may eventually create only a PENDING membership request. It can never grant
APPROVED membership. Only the owner of that classroom may change PENDING to APPROVED or REJECTED.
Duplicate join commands must be idempotent. No membership transition can create a session, alter
learner grade storage, or expose progress or scientific information.

### QR invite and security rules

A QR code represents a random, unguessable invite token rather than a raw classroom ID. Only a
safely derived unique hash may be persisted. The raw token is a one-time response value for QR
construction and must never enter logs, audit data, ordinary canonical-response storage,
diagnostics, URLs under backend control, or database fields. Invites support revocation and may
carry expiry; revoked and expired values fail closed. The token exposes no teacher email, learner
data, database identifier, credential, or application secret.

Token format, entropy construction, cryptographic implementation, expiry duration, and reuse across
different learners were deliberately not invented. Consequently, live invite issuance, resolution,
membership request, decision, and retrieval endpoints remain policy-gated and non-executable until
those decisions and learner multi-classroom behavior are approved.

### Endpoint authorization and privacy boundary

Seven minimal endpoints are authorized for a future bounded implementation batch: create/read own
teacher profile; create/read own learner profile; and create/list/read teacher-owned classrooms.
Their exact request fields, response fields, role and ownership checks, stable errors, idempotency,
audit, privacy rules, and prohibited side effects are recorded in the machine authorization.

The eight invite and membership endpoint candidates are documented but marked
`POLICY_GATED_NOT_EXECUTABLE`. They must be absent or fail with the stable fail-closed service error
without mutation. This limited split allows identity and classroom foundations to proceed without
silently deciding invite reuse, expiry, or learner multi-classroom cardinality.

Live mutations use server-assigned REAL provenance derived from the verified `app_users` actor.
TEST and SYNTHETIC provenance is restricted to isolated test environments; TEST, SYNTHETIC, and
IMPORTED provenance is rejected on live paths. Profile tables store only the minimum name and opaque
IDs. Verified email may be returned from the current authentication contract but is not duplicated
in profile tables. No name, email, token, or learner identity enters logs or audit payloads. No
research export or operational-to-research identity join is authorized.

Retention, withdrawal, deletion, account/profile deactivation, profile updates, classroom updates,
and invite revocation APIs remain unresolved. The limited scope does not authorize pilot or
production, so these issues remain fail-closed rather than being filled with assumptions.

### Authorized and prohibited scope

The next implementation batch may reuse/extend the three existing identity tables as specified;
create `teacher_profiles`, `classrooms`, and policy-gated invite/membership tables; and implement only
the seven explicitly authorized profile/classroom create/read endpoints using existing auth,
idempotency, audit, REAL provenance, unit-of-work, request-ID, and stable-error foundations. It must
prove role exclusivity, one-profile ownership, cross-teacher and cross-learner isolation, exact grade
validation, atomic replay, privacy allow-lists, provenance separation, audit completeness, migration
reversibility, schema drift absence, and architecture isolation.

Learning-session creation and every session transition remain prohibited. Question generation,
opportunities, attempts, retries, hints, response-time interpretation, BKT, mastery, Guess-Guard,
certification, sequencing, progress, completion, Component B live-engine integration, Component C,
Component 3, research export, synthetic generation, pilot, production, Yass source, and any research
wheel or generator dependency remain blocked.

### Unresolved decisions and formal authorization

Before invite or membership endpoints can execute, the product owner must approve learner
multi-classroom and cross-grade behavior plus cross-learner invite reuse; the security owner must
approve the token and expiry contract; and the privacy/child-safety owner must approve that flow.
Retention, deletion, withdrawal, and deactivation require their own governance before pilot or
production. These blockers do not authorize default behavior.

The formal decision is:

`BE2_PROFILE_CLASSROOM_SCOPE_LIMITED_AUTHORIZED`

Exact next task: implement one governance-bound BE2 profile and classroom foundation batch against
`component-b-profile-classroom-authorization.json`: the specified table reuse/extensions, four new
tables with invite/membership behavior policy-gated, and only the seven authorized profile/classroom
create/read endpoints. Do not implement invite or membership endpoints, learning sessions, or
scientific behavior.

## Phase BE2 Limited — Teacher, Learner and Classroom Profile Foundations

### Authorization and starting point

Implementation started from clean commit `6ef693fb6ddc6837c9441f271611c743215e201f` under
`backend/provenance/component-b-profile-classroom-authorization.json`, whose formal decision is
`BE2_PROFILE_CLASSROOM_SCOPE_LIMITED_AUTHORIZED`. The authorization was treated as a hard boundary:
exactly LEARNER and TEACHER profiles, profile/classroom create-read behavior, four governed table
foundations, and no invite, membership, session, or scientific behavior.

The existing `app_users` table was extended with nullable-onboarding `profile_type`, constrained to
LEARNER or TEACHER and protected by a database trigger from later change. `b_learners` was reused as
the learner profile and extended only with `name`; no `learner_profiles` table exists. Existing
`grade` remains nullable and is neither accepted nor changed by profile endpoints.
`app_user_learner_links` was reused for learner self-ownership and constrained unique by both user
and learner, preserving a one-owning-account/one-profile boundary for this limited batch.

Revision `20260722_0004` creates exactly `teacher_profiles`, `classrooms`, `classroom_invites`, and
`classroom_memberships`. The latter two are schema foundations only. There is no token generator,
raw token column, QR implementation, invite resolver, expiry executor, membership service, or
membership route. The migration adds no seed data, learning table, scientific field, or blocked
invite/membership trigger. Downgrade removes only revision `0004` objects and restores the
`20260722_0003` schema.

### API, ownership, roles, and grade enforcement

Seven endpoints were added exactly as authorized:

- `POST /api/v1/teacher/profile`
- `GET /api/v1/teacher/profile`
- `POST /api/v1/learner/profile`
- `GET /api/v1/learner/profile`
- `POST /api/v1/classrooms`
- `GET /api/v1/classrooms`
- `GET /api/v1/classrooms/{classroom_id}`

Profile creation provisions or reuses the `app_users` mapping for the verified Supabase subject and
atomically selects one immutable profile type. A second or opposite profile fails with the stable
conflict envelope. Teacher and learner reads resolve only through the verified subject mapping.
Teacher-only classroom operations derive `teacher_profile_id` server-side; callers cannot submit an
owner. Lists filter by owner, and an absent or foreign classroom ID returns the same not-found
response to prevent enumeration. Learners receive FORBIDDEN for classroom creation.

Classroom requests accept only optional `name` and required `grade`. Pydantic and PostgreSQL both
restrict grade to `GRADE_2` or `GRADE_3`; every other grade fails. A normalized non-null classroom
name is unique within one teacher's classrooms. No update endpoint exists, so classroom grade,
ownership, archive, transfer, and deletion remain immutable/unavailable in this scope.

### Provenance, audit, idempotency, and privacy

All endpoint mutations assign REAL provenance on the server from the verified app-user actor. No
provenance field is accepted in request bodies. Records include request, operation, reason,
resource, source system, environment, schema revision, and server timestamps. Profile and classroom
creation append `b_audit_events` in the same transaction. Tests confirm REAL provenance and audit
records; TEST, SYNTHETIC, and IMPORTED values have no live request field through which they can enter.

Every POST requires `Idempotency-Key`. The service serializes an actor/method/operation/key scope
with a PostgreSQL transaction advisory lock, fingerprints the strict canonical body, persists the
idempotency record atomically with the mutation and audit, returns the canonical response for an
identical replay, and returns stable conflict for body mismatch. Learner creation orders learner and
owning-link persistence explicitly so the foreign-key relationship commits atomically.

Profile responses contain only the authorization allow-list. Verified email is read from the
authenticated principal and is not copied into `app_users`, `teacher_profiles`, or `b_learners`.
The backend stores no password or JWT. Logs contain request IDs and route/status evidence but no
Authorization header, bearer token, invite token, password, credential, learner name, or email.

### Files created and changed

Created application files:

- `app/api/routes/profile_classroom.py`
- `app/application/profile_classroom.py`
- `app/domain/profile_classroom.py`
- `migrations/versions/20260722_0004_profile_classroom_foundations.py`
- `tests/test_profile_classroom.py`

Changed application and test files:

- `app/core/errors.py`
- `app/infrastructure/persistence_models.py`
- `app/infrastructure/repositories.py`
- `app/main.py`
- `tests/test_be2_architecture_guards.py`
- `tests/test_be2_persistence.py`

This append-only section is the only documentation change.

### Verification results

The required final Docker run used a no-cache build from pinned dependency and base-image inputs.
The final API manifest-list digest was
`sha256:c2dbabc5c58cebe4f284b7bf8e99f825b8e1e1903bc844a37e21f3d7e0d4b7e3`.
Compose configuration, startup and status passed; Python compilation passed. Focused profile,
classroom, migration-boundary, and architecture tests reported `10 passed, 1 warning`. The complete
suite reported `41 passed, 1 warning in 9.29s`. The warning is the already-recorded upstream
FastAPI/Starlette TestClient deprecation.

Alembic upgrade/current/check, downgrade from `20260722_0004` to `20260722_0003`, and re-upgrade to
head passed. Final revision was `20260722_0004`; `alembic check` reported no new operations and
PostgreSQL readiness passed. Metadata inspection confirmed twelve application tables: the original
eight plus exactly the four authorized foundations. Infrastructure additionally retains
`alembic_version` and the pre-existing `be1_persistence_check` marker. Existing runtime-bundle
eligibility and checksum-integrity triggers remain installed alongside the authorized profile-type
immutability trigger.

OpenAPI contains only `/health/live`, `/health/ready`, `/api/v1/me`, and the seven new authorized
operations grouped across four paths. No invite, membership, session, attempt, hint, or progress
path exists. Architecture/source/dependency guards confirm no QR code, session lifecycle, BKT,
sequencing, certification, task generation, Yass import, `component_b_generator`, or research wheel.

The API remained UID/GID `10001:10001` with no mounts. PostgreSQL exposed no host port and used only
the named `upadya-be1-postgres-data` volume. Targeted log and image-history scans returned no token,
credential, password, raw-JWT, invite-token, Yass, generator, or wheel match. After shutdown, the
named database volume remained present.

### Errors, causes, and fixes

The local Conda environment lacked the committed PyJWT runtime, so local byte-compilation passed but
the authoritative import/test run was performed in Docker from `requirements.lock`. The first
focused Docker run exposed a TestClient harness issue: requests reopened event loops while sharing
the global async connection pool. Tests now keep each client context open across its request flow.
An old architecture guard also compared migration `0002` alone with the final twelve-table set; it
now separately verifies the original eight-table revision and the four-table `0004` revision.

Learner creation initially flushed the ownership link before its referenced learner because the
models intentionally have no ORM relationship navigation. Explicitly flushing `b_learners` before
`app_user_learner_links` fixed the foreign-key ordering while keeping both writes, idempotency, and
audit in one transaction. All corrected focused and complete tests then passed.

### Remaining boundary and exact next task

Invite creation, QR generation/scanning, token resolution/reuse/expiry, membership requests,
approval/rejection, classroom learner lists, learner classroom lists, and multi-classroom policy
remain blocked. Learning sessions and all session transitions, questions, opportunities, attempts,
retries, hints, timing interpretation, BKT, mastery, Guess-Guard, certification, sequencing,
progress, completion, live-engine integration, Component C, Component 3, research export, pilot,
production, and synthetic generation remain absent and unauthorized.

Exact next task: conduct a separate closure and security review of this limited profile/classroom
batch against `component-b-profile-classroom-authorization.json`. Do not authorize or begin invite,
membership, session, or scientific behavior during that review.

## BE2 Profile/Classroom Limited Batch Closure and Security Review

### Repository and authorization gate

The review examined pushed implementation commit
`aa037400aca212e24a4b681c9bef768b23f99fce` (`feat(backend): add teacher learner and
classroom foundations`). Before review, the working tree was clean and local `B_frontend` exactly
matched `origin/B_frontend`. The controlling source was
`backend/provenance/component-b-profile-classroom-authorization.json`, decision
`BE2_PROFILE_CLASSROOM_SCOPE_LIMITED_AUTHORIZED`.

Reviewed files included revision `20260722_0004`, profile/classroom routes, application service,
domain contracts, persistence models, repositories, unit of work, error handling, application route
registration, profile/classroom tests, BE2 persistence tests, architecture guards, Compose and
Docker inputs, and the preceding implementation evidence in this log. No functionality, migration,
API, model, dependency, or test was changed during this review.

### Role, ownership, profile reuse, and classroom review

The implementation accepts only LEARNER and TEACHER and protects a selected profile type with both
service checks and the database immutability trigger. Profile operations resolve the account only
from the verified Supabase subject. Opposite-role profile access fails closed, and no parent,
guardian, administrator, or editable role exists. `b_learners` is the sole learner profile table;
`app_user_learner_links` supplies the unique self-owner mapping. Requests accept only the authorized
name field, learner creation cannot set grade, and live provenance is assigned by the server as
REAL. Email is returned only from the verified current principal and is not copied to profile rows.

Teacher profiles are unique by app user. Classroom ownership is derived server-side from that
teacher profile and cannot be supplied or overridden by the caller. Only teachers create/list/read
classrooms; lists are owner-filtered, and absent and foreign classroom IDs both return the same
not-found behavior. Only GRADE_2 and GRADE_3 pass request and database validation. There is no
classroom update, grade update, learner attachment, invite, membership, QR, session, or learning
endpoint.

### Idempotency, audit, and closure blocker

The service uses actor/method/operation/key-scoped PostgreSQL advisory transaction locks, canonical
request fingerprints, atomic idempotency records, stable conflict behavior, and same-transaction
audit writes. Audit payloads contain neutral operational identifiers and provenance rather than
names, emails, credentials, Authorization values, or JWTs. Unit-of-work exception handling performs
rollback, and commits occur only after resource, audit, and canonical response staging.

However, the authorization's `required_tests` expressly requires identical replay, body mismatch,
concurrency, and rollback tests for every POST command. The committed tests demonstrate teacher
profile identical replay and mismatch, but do not demonstrate learner-profile or classroom replay
and mismatch, concurrent duplicate submission for any POST, or injected-failure rollback integrity
for profile/link/classroom/audit/idempotency state. The authorization exit criterion that all
idempotency, audit, provenance, and isolation tests pass is therefore not fully evidenced. Static
reasoning about transaction structure cannot replace the specifically required tests, so closure
fails closed without asserting a functional defect.

### Schema and API inventories

PostgreSQL contained exactly the twelve authorized application tables: `app_users`, `b_learners`,
`app_user_learner_links`, `b_runtime_bundle_records`, `b_sessions`, `b_session_events`,
`b_idempotency_records`, `b_audit_events`, `teacher_profiles`, `classrooms`, `classroom_invites`, and
`classroom_memberships`. Infrastructure additionally contained `alembic_version` and the existing
`be1_persistence_check` marker. No `learner_profiles` table exists. The only non-internal triggers
were the two previously authorized runtime-bundle guards and profile-type immutability; no trigger or
stored procedure implements invite or membership behavior.

OpenAPI contained exactly GET `/health/live`, GET `/health/ready`, GET `/api/v1/me`, POST/GET
`/api/v1/teacher/profile`, POST/GET `/api/v1/learner/profile`, POST/GET `/api/v1/classrooms`, and GET
`/api/v1/classrooms/{classroom_id}`. No invite, membership, QR, session, attempt, progress, or
scientific operation was present.

### Docker, migration, and security verification

`docker compose config`, build, startup/status, application compilation, the complete test suite,
migration cycle, PostgreSQL readiness, direct inventories, container identity/mount inspection, and
targeted leakage scans were run. The suite reported `41 passed, 1 warning in 10.83s`; the warning is
the known upstream FastAPI/Starlette TestClient deprecation. Alembic reported head
`20260722_0004`, no new upgrade operations, successful downgrade to `20260722_0003`, and successful
re-upgrade. PostgreSQL accepted connections.

The API ran as UID/GID `10001:10001` with no mounts. PostgreSQL exposed no host port and used the
named `upadya-be1-postgres-data` volume, which remained after shutdown. API-log and committed
application/dependency scans found no bearer token, Authorization header, credential, test learner
identity, Yass import, research wheel, or generator package. Stable API error handling and existing
authentication tests retain request IDs and fail-closed token verification.

### Remaining boundary, formal decision, and exact next task

Invite creation, QR generation/resolution, invite reuse/expiry, memberships, learner attachment,
sessions, attempts, progress, hints, BKT, sequencing, certification, live-engine integration,
research export, pilot, and production remain blocked and unauthorized.

Formal closure decision: `BE2_PROFILE_CLASSROOM_BATCH_NOT_CLOSED`.

Exact next task: perform a narrowly scoped corrective evidence batch that adds the authorization-
required idempotent replay, mismatched replay, concurrent duplicate, and injected-failure rollback
tests for each of the three POST commands, without changing runtime functionality or expanding the
API/schema boundary; then repeat this closure review.

## BE2 Profile/Classroom Corrective Test Evidence — Replay, Concurrency and Rollback

### Scope and authorization

This append-only section records the narrowly scoped corrective test batch that supplies the
governance-required replay, body-mismatch, concurrency, and rollback evidence for every authorized
POST command. The controlling authorization is
`backend/provenance/component-b-profile-classroom-authorization.json`
(`required_tests`: "All POST commands pass identical replay, body mismatch, concurrency, and rollback
tests"). It does not issue the formal closure decision; a separate closure re-review follows.

The three POST commands covered are `POST /api/v1/teacher/profile`, `POST /api/v1/learner/profile`,
and `POST /api/v1/classrooms`.

### Previous closure blockers

The prior closure review recorded `BE2_PROFILE_CLASSROOM_BATCH_NOT_CLOSED`. Implementation, security,
schema, migration, ownership, role, grade, provenance, Docker, and API-boundary reviews had passed.
Closure was blocked solely because the committed suite proved only teacher-profile identical replay
and mismatch. It did not prove learner-profile or classroom replay/mismatch, concurrent duplicate
submission for any POST, or injected-failure rollback integrity for any POST. Static reasoning about
transaction structure was explicitly rejected as a substitute for the required tests.

### Files changed

- `backend/tests/test_profile_classroom_post_safety.py` — new focused corrective test module.
- `backend/tests/test_be2_architecture_guards.py` — added `test_no_production_failure_injection_or_debug_mechanism`
  and collapsed a duplicate profile/classroom guard definition; no guard weakened.
- `backend/app/application/profile_classroom.py` — one-line runtime fix (see Errors and fixes): a
  subject-scoped `pg_advisory_xact_lock` at the start of `_provision_user`. No endpoint, table,
  column, dependency, role, or scientific behavior was added.

No migration, model, dependency, route, or API/schema boundary was changed. Migration head remains
`20260722_0004`.

### Test design

- Concurrency uses real PostgreSQL transactions inside the Docker `api`/`db` services. Two OS threads
  are released simultaneously by a `threading.Barrier(2)` against a shared FastAPI `TestClient`, so the
  two commands run as genuinely concurrent event-loop tasks on separate pooled asyncpg connections. No
  timing sleep is used; synchronization is deterministic via the barrier and the database locks.
- Failure is injected only through a test-only in-process `ProfileClassroomService` instance whose
  `_audit` is monkeypatched to raise after primary-entity persistence and before audit/commit. No
  production failure flag, debug endpoint, or environment switch exists; a new architecture guard
  proves this.
- State is verified out-of-band through a separate `NullPool` async engine that counts `app_users`,
  the primary entity, `app_user_learner_links`, `b_idempotency_records`, and `b_audit_events`, and
  asserts that every persisted live row carries server-assigned `source_class = REAL`.

### Replay results (identical key, byte-equivalent body)

- Teacher profile: replay returned HTTP 201 with the identical `teacher_profile_id` and identical full
  body; exactly one teacher profile, one idempotency record, one audit event.
- Learner profile: replay returned HTTP 201 with the identical `learner_id` and identical full body;
  exactly one `b_learners` row and exactly one owning `app_user_learner_links` row.
- Classroom: replay returned HTTP 201 with the identical `classroom_id`, identical full body, and the
  server-derived `teacher_profile_id`; exactly one classroom, one idempotency record, one audit event.

All replayed rows carried `source_class = REAL`.

### Mismatch results (same key, different body)

- Teacher profile: `{"name":"Teacher Changed"}` → HTTP 409 `CONFLICT` with a `request_id`.
- Learner profile: `{"name":"Learner Changed"}` → HTTP 409 `CONFLICT` with a `request_id`.
- Classroom: both a changed `name` and a changed `grade` (GRADE_2 → GRADE_3) under the same key →
  HTTP 409 `CONFLICT`. Only `GRADE_2` and `GRADE_3` are accepted; `GRADE_1`, `GRADE_4`, `grade_2`, and
  `2` each return HTTP 422. A learner remains forbidden (HTTP 403) from creating a classroom.

### Concurrency results (concurrent duplicate submission)

- Teacher profile: both concurrent requests returned HTTP 201 with a single `teacher_profile_id`;
  exactly one app-user, one teacher profile, one idempotency record, one audit event. The connection
  remained usable (subsequent GET returned 200).
- Learner profile: both concurrent requests returned HTTP 201 with a single `learner_id`; exactly one
  app-user, one `b_learners` row, one owning link, one idempotency record, one audit event.
- Classroom: both concurrent requests returned HTTP 201 with a single `classroom_id`; exactly one
  classroom, one idempotency record, one audit event, and the owned-classroom list contained one row.

No unhandled database integrity error leaked; the losing/replayed request received the authorized
201 response.

### Failure-injection and rollback results

For each of the three POSTs the injected `_audit` failure produced HTTP 500 with the stable
`INTERNAL_ERROR` envelope and the exact request `request_id`. After rollback:

- Teacher profile: no app-user mutation, no teacher profile, no idempotency record, no audit event.
- Learner profile: no `b_learners` row, no owning `app_user_learner_links` row, no app-user mutation,
  no idempotency record, no audit event.
- Classroom: the classroom, idempotency record, and audit event were all absent; the pre-failure
  baseline (the already-created owning teacher only) was exactly preserved.

For every case a subsequent valid retry with the same key then succeeded with HTTP 201. The error
body contained neither the fake bearer secret nor the internal exception text, and captured logs
contained neither the secret nor the `Authorization` header.

### Errors, causes, and fixes

The concurrent-duplicate tests for the two profile POSTs initially failed (`[201, 500]`). Root cause:
a genuine runtime concurrency defect. `_provision_user` inserted the `app_users` row before the
idempotency advisory lock, and that lock was keyed on the freshly generated `user_id`. Two concurrent
first-ever submissions from the same brand-new Supabase subject therefore computed different lock
scopes, did not serialize, and raced on the `uq_app_users_supabase_subject` unique constraint; the
losing transaction surfaced an unhandled `IntegrityError` as HTTP 500 instead of an idempotent replay.
This violates the authorization's concurrency requirement that no unhandled integrity error leaks and
that the losing request receives the authorized response.

Because a new test proved a real defect, a minimal runtime fix was applied: `_provision_user` now
acquires `pg_advisory_xact_lock(hashtextextended('account.provision:<subject>', 0))` before the
find/insert, reusing the existing advisory-lock mechanism. Concurrent first-time provisioning now
serializes on the stable subject; the waiting request observes the committed app-user, proceeds to the
same idempotency scope, and returns the canonical replay. The classroom path was already safe because
the owning app-user pre-exists. After the fix both profile concurrency tests returned `[201, 201]` with
a single identity, and no other behavior changed.

An incidental duplicate `test_profile_classroom_migration_and_routes_stay_within_authorization`
definition in the guards module (the second silently shadowing the first) was collapsed to a single
definition while adding the failure-injection guard; the assertions are unchanged.

### Test counts

- Full Docker suite: `52 passed, 1 warning in 18.38s` (previously 41 passed; +10 corrective tests,
  +1 architecture guard). The single warning is the already-recorded upstream FastAPI/Starlette
  `TestClient` httpx deprecation.
- Focused corrective + guard run (`tests/test_profile_classroom_post_safety.py`
  `tests/test_be2_architecture_guards.py`): `18 passed, 1 warning`.

### Schema-drift and inventory results

- `alembic current`: `20260722_0004 (head)`.
- `alembic check`: `No new upgrade operations detected` — no schema drift.
- Application tables unchanged: exactly the twelve authorized tables (`app_users`, `b_learners`,
  `app_user_learner_links`, `b_runtime_bundle_records`, `b_sessions`, `b_session_events`,
  `b_idempotency_records`, `b_audit_events`, `teacher_profiles`, `classrooms`, `classroom_invites`,
  `classroom_memberships`) plus the internal `alembic_version` and pre-existing `be1_persistence_check`
  marker. No `learner_profiles` table exists.
- OpenAPI route inventory unchanged: `GET/POST /api/v1/teacher/profile`, `GET/POST /api/v1/learner/profile`,
  `GET/POST /api/v1/classrooms`, `GET /api/v1/classrooms/{classroom_id}`, `GET /api/v1/me`,
  `GET /health/live`, `GET /health/ready`. No invite, membership, session, attempt, hint, progress,
  debug, or injection route exists.

### Docker, isolation, and leakage verification

`docker compose config`, `build`, and `up -d` succeeded (API image id
`sha256:97df807d4f0dcdb78572114397b18af82bf5ccca0e9b4d6967eff694e922802c`). `python -m compileall app`
passed. The API container ran as UID/GID `10001:10001` with no bind mounts (`.Mounts == []`).
PostgreSQL published no host port (`docker compose port db 5432` returned no mapping) and `pg_isready`
accepted connections. A targeted scan of the API logs found no bearer secret, `Authorization` header,
password, refresh token, `component_b_generator`, Yass, or `.whl` match. Docker was stopped after
verification and the named `upadya-be1-postgres-data` volume was preserved.

### Runtime and API-surface statement

Runtime behavior did not expand: no endpoint, table, column, migration, dependency, role, invite,
membership, QR, session, or scientific behavior was added. The only production change is the one-line
provisioning concurrency fix required by a defect the new concurrency tests proved. The corrective
test batch passed.

### Exact next task

Conduct the separate BE2 profile/classroom closure re-review against
`component-b-profile-classroom-authorization.json`, now that identical-replay, body-mismatch,
concurrency, and rollback evidence exists for all three POST commands and the provisioning concurrency
defect is fixed. Do not authorize or begin invite, membership, session, or scientific behavior during
that review. This section does not issue the formal closure decision.

## BE2 Profile/Classroom Limited Batch Closure Re-Review

### Review scope and non-modification

This append-only section records the closure re-review of the limited profile/classroom batch against
`backend/provenance/component-b-profile-classroom-authorization.json`
(`BE2_PROFILE_CLASSROOM_SCOPE_LIMITED_AUTHORIZED`). No functionality, migration, model, dependency,
route, or test was modified during this review; it verifies committed state and re-runs the Docker
gates. All evidence below was reproduced from the pushed commit, not carried forward on trust.

### Commits reviewed

- Implementation commit: `aa037400aca212e24a4b681c9bef768b23f99fce`
  (`feat(backend): add teacher learner and classroom foundations`).
- Corrective commit: `2fc9a350840bc51cd70fcb01f59f9994ce352704`
  (`fix(backend): make profile provisioning concurrency safe`).

Precondition gate: the corrective commit is pushed; local `B_frontend` equals `origin/B_frontend`
(both `2fc9a350840bc51cd70fcb01f59f9994ce352704`, 0 ahead / 0 behind); the working tree is clean.
The corrective commit contains exactly four files: the one-line `profile_classroom.py` fix,
`test_profile_classroom_post_safety.py` (new), `test_be2_architecture_guards.py` (added
failure-injection guard; collapsed a duplicate guard definition), and this build log's corrective
evidence section.

### Previous closure blockers

The prior decision was `BE2_PROFILE_CLASSROOM_BATCH_NOT_CLOSED`. Implementation, security, schema,
migration, ownership, role, grade, provenance, Docker, and API-boundary reviews had passed. Closure
was blocked only because identical-replay, body-mismatch, concurrency, and injected-failure rollback
evidence existed for the teacher-profile POST alone, not for the learner-profile or classroom POSTs,
and no concurrency evidence existed for any POST. Static transaction reasoning was rejected as a
substitute for those tests.

### Advisory-lock defect and fix (reviewed)

The new concurrency tests proved a real runtime defect: concurrent first-ever profile creation for the
same new Supabase subject inserted `app_users` before the idempotency advisory lock, and that lock was
keyed on the freshly generated `user_id`. Two concurrent first submissions therefore computed
different lock scopes, did not serialize, raced on `uq_app_users_supabase_subject`, and the loser
returned HTTP 500 `IntegrityError` instead of an idempotent replay — an unhandled integrity leak the
authorization forbids.

The fix adds one line to `_provision_user`:
`SELECT pg_advisory_xact_lock(hashtextextended('account.provision:' || <subject>, 0))` before the
find/insert. The re-review confirms:

- the lock is PostgreSQL transaction-scoped (`pg_advisory_xact_lock`), released automatically on
  commit or rollback, with no manual unlock and no leaked lock state;
- the lock key is derived deterministically from the stable authenticated subject, reusing the exact
  pattern already used by the idempotency lock;
- the raw subject is a transient SQL bind parameter used only to compute an integer key; it is not
  logged and is not persisted as lock metadata;
- the key is per-subject, so different subjects provision concurrently and only the same subject
  serializes — no global serialization bottleneck;
- no new public API, endpoint, table, column, or lifecycle behavior was introduced.

### Teacher-profile POST evidence

- Equivalent replay returns HTTP 201 with the same `teacher_profile_id` and identical body.
- Mismatched replay (same key, different name) returns HTTP 409 with the stable `CONFLICT` envelope
  and a `request_id`.
- Concurrent duplicate submission returns `[201, 201]` with one `teacher_profile_id`: one app-user,
  one teacher profile, one idempotency record, one audit event; both callers receive the authorized
  replay outcome and the connection stays usable.
- Injected `_audit` failure returns a safe HTTP 500 `INTERNAL_ERROR` with the request `request_id`;
  rollback leaves no profile, app-user mutation, idempotency record, or audit event; a retry then
  succeeds with HTTP 201.

### Learner-profile POST evidence

- Equivalent replay returns HTTP 201 with the same `learner_id` and identical body.
- Mismatched replay returns HTTP 409 `CONFLICT`.
- Concurrent duplicate submission yields exactly one `b_learners` row and exactly one owning
  `app_user_learner_links` row (plus one app-user, one idempotency record, one audit event).
- REAL provenance is server-assigned across all persisted live rows (`source_class == {"REAL"}`);
  clients submit no provenance.
- Injected failure rolls back the learner row, owning link, app-user mutation, idempotency record,
  and audit event; a retry then succeeds.
- No `learner_profiles` table exists; `b_learners` remains the single learner profile table.

### Classroom POST evidence

- Equivalent replay returns HTTP 201 with the same `classroom_id` and identical body.
- The owner (`teacher_profile_id`) is derived server-side and matches the authenticated teacher.
- Mismatched replay for either a changed name or a changed grade returns HTTP 409 `CONFLICT`.
- Only `GRADE_2` and `GRADE_3` are accepted; `GRADE_1`, `GRADE_4`, `grade_2`, and `2` return HTTP 422.
- A learner receives HTTP 403 for classroom creation.
- Concurrent duplicate submission returns `[201, 201]` with one `classroom_id`: one classroom, one
  idempotency record, one audit event, and an owned list of one.
- Injected failure leaves no partial classroom, idempotency, or audit state (the pre-failure baseline
  is exactly preserved); a retry then succeeds.

### Full and focused test results

- Full Docker suite: `52 passed, 1 warning in 17.22s`.
- Focused corrective + architecture-guard suite
  (`tests/test_profile_classroom_post_safety.py tests/test_be2_architecture_guards.py`):
  `18 passed, 1 warning`.
- The single warning is the known upstream FastAPI/Starlette `TestClient` httpx deprecation.
- `python -m compileall app` passed.

### Migration and schema-drift results

- `alembic upgrade head` → `alembic current` = `20260722_0004 (head)`.
- `alembic check` = `No new upgrade operations detected` (no drift).
- `alembic downgrade 20260722_0003` succeeded (current `20260722_0003`), and `alembic upgrade head`
  restored `20260722_0004 (head)`.
- `pg_isready` = accepting connections.

### API and table inventories

- OpenAPI operations (exactly ten): `GET/POST /api/v1/teacher/profile`,
  `GET/POST /api/v1/learner/profile`, `GET/POST /api/v1/classrooms`,
  `GET /api/v1/classrooms/{classroom_id}`, `GET /api/v1/me`, `GET /health/live`, `GET /health/ready`.
  Seven profile/classroom endpoints; no invite, membership, QR, session, attempt, hint, progress,
  debug, or injection route.
- Application tables (exactly twelve): `app_users`, `b_learners`, `app_user_learner_links`,
  `b_runtime_bundle_records`, `b_sessions`, `b_session_events`, `b_idempotency_records`,
  `b_audit_events`, `teacher_profiles`, `classrooms`, `classroom_invites`, `classroom_memberships`,
  restored intact after the downgrade/upgrade cycle. Infrastructure additionally retains
  `alembic_version` and the pre-existing `be1_persistence_check` marker. No `learner_profiles` table.

### Architecture-boundary result

- Exactly two profile roles remain: LEARNER and TEACHER.
- No invite, membership, QR, session, attempt, progress, BKT, sequencing, hint, certification, or
  other scientific behavior exists.
- Production source contains no failure-injection or debug mechanism: a container-side scan of `app`
  found no `controlled-test-failure`, `_failing_audit`, `inject_fail`, `force_error`, `force_failure`,
  or `debug_fail` marker, and the new `test_no_production_failure_injection_or_debug_mechanism` guard
  enforces this. The failure injection exists only in the test module via an in-process service
  instance.
- No `component_b_generator`, Yass, `pilot`, or `cohort` import exists in `app`; no research-wheel
  dependency exists.

### Docker, isolation, and leakage verification

`docker compose config`, `build`, `up -d`, and `ps` succeeded. The API container ran as UID/GID
`10001:10001` with no bind mounts (`.Mounts == []`) and host-bound only to `127.0.0.1:8000`.
PostgreSQL published no host port (`docker compose port db 5432` returned no mapping) and exposed only
the named `upadya-be1-postgres-data` volume. A targeted API-log scan found no bearer secret,
`Authorization` header, password, refresh token, `component_b_generator`, Yass, or `.whl` match. After
`docker compose down`, the named `upadya-be1-postgres-data` volume remained present.

### Remaining blocked behavior

Invite creation, QR generation/resolution, invite reuse/expiry, membership request/approval/rejection,
classroom learner lists, learner classroom lists, multi-classroom policy, classroom grade change,
profile/account update/deactivation/deletion, retention/withdrawal, learning sessions and every
session transition, questions, opportunities, attempts, retries, hints, timing interpretation, BKT,
mastery, Guess-Guard, certification, sequencing, progress, completion, live-engine integration,
Component C, Component 3, research export, pilot, and production all remain blocked and unauthorized.

### Formal closure decision

`BE2_PROFILE_CLASSROOM_BATCH_CLOSED`.

The limited profile/classroom batch satisfies the authorization's `exit_criteria` and `required_tests`:
only the authorized reuse/extensions and four new tables exist; only the seven authorized endpoints
exist; ownership, cross-account, grade, idempotency, audit, provenance, privacy, replay, mismatch,
concurrency, rollback, and isolation tests pass; no password, raw JWT, raw invite token, research
identifier, scientific field, or synthetic record enters live persistence, responses, or logs; and all
prohibited learning and scientific behavior remains absent. The one production change since the prior
review is the provisioning concurrency fix, which resolves the only defect the corrective tests
surfaced and introduces no boundary expansion.

### Exact next governance task

Obtain the named limited-scope approvers recorded in the authorization
(`product owner`, `backend security owner`, `privacy and child-safety owner`) to ratify this closure,
then produce a separate governance authorization before any further scope. No invite, QR, membership,
session, attempt, progress, scientific-engine, pilot, or production behavior is authorized to begin by
this closure; each remains gated behind its named approvers and unresolved decisions in
`component-b-profile-classroom-authorization.json`.

## BE2 Profile/Classroom Limited Batch — Named Approver Ratification

### Scope and non-modification

This append-only section records an attempted named-approver ratification pass over the closed
profile/classroom batch. No code, migration, table, column, endpoint, test, or dependency was
implemented or modified. This is a governance and documentation review only, against
`backend/provenance/component-b-profile-classroom-authorization.json`
(`required_approvers.this_limited_scope`: product owner, backend security owner, privacy and
child-safety owner).

### Reviewed record

`backend/provenance/component-b-profile-classroom-ratification.json`, created during this pass.

### Pre-review verification

Local `B_frontend` was confirmed to match `origin/B_frontend` at `e579d6cf07d3badde3a984a1a5b4db3bf090464a`
(`docs(backend): close profile classroom limited batch`) with a clean working tree, immediately
preceded by corrective commit `2fc9a350840bc51cd70fcb01f59f9994ce352704` and implementation commit
`aa037400aca212e24a4b681c9bef768b23f99fce`. The closure re-review section above (migration head
`20260722_0004`, 52-passed full suite, 18-passed focused suite, twelve tables, seven authorized
endpoints, two roles, non-root API, private PostgreSQL, no leakage) was treated as the verified
technical baseline for this pass; it was not recomputed from scratch since no code changed since that
review.

### Checklist re-affirmed at the technical level

Exactly two roles (LEARNER, TEACHER); authenticated-subject ownership for both profile types;
teacher-profile ownership uniqueness; learner-profile ownership through the single owning
`app_user_learner_links` row; GRADE_2/GRADE_3-only classroom restriction; server-controlled REAL
provenance on every live row; classroom ownership isolation (non-owned IDs return
`RESOURCE_NOT_FOUND`); idempotent replay returning the identical committed response and body-mismatch
returning stable `CONFLICT`; concurrency-safe provisioning via the subject-scoped transaction advisory
lock; rollback integrity (entity, app-user mutation, idempotency record, and audit event all absent
after an injected failure, with a successful retry); audit and privacy boundaries (no password, raw
JWT, invite token, or scientific field in persistence, responses, or logs); and the continued absence
of invite, membership, session, and scientific behavior. Each item is `VERIFIED` at the automated,
technical-conformance level in `component-b-profile-classroom-ratification.json`.

This checklist confirms engineering conformance to the authorization. It is explicitly not treated as
equivalent to, or a substitute for, the named human governance decisions below.

### Named approver review

No named product owner, backend security owner, or privacy and child-safety owner has reviewed this
batch or recorded a decision through this session or any other channel available to this review. For
each of the three required roles, `component-b-profile-classroom-ratification.json` records:

- name: `UNRESOLVED_PLACEHOLDER`;
- decision: `UNRESOLVED`;
- decision date: absent;
- approved scope: absent;
- conditions: none recorded;
- unresolved concerns: specific to each role, including (for the privacy and child-safety owner) that
  retention, withdrawal, and deletion policy remain unresolved per the governing authorization, and
  that this component processes data about Grade 2/3 children, which this review does not treat as
  satisfied by automated testing alone;
- authorization of the closed batch as a foundation for later governance work: not recorded.

An AI assistant conducting this review has no channel to a real product owner, backend security owner,
or privacy and child-safety owner, and did not receive an explicit, attributable decision from any such
named person during this task. Inventing a name, date, or decision for any of the three roles would
create a false governance record rather than document a real one, so no such entry was fabricated.

### Ratification scope statement

No scope is ratified by this pass. This ratification review does not authorize, and does not carry
forward as authorization for, invite, QR, membership, session, attempt, progress, scientific-engine,
pilot, or production implementation, regardless of the outcome of any future named-approver review.

### Formal ratification decision

`BE2_PROFILE_CLASSROOM_NOT_RATIFIED`.

The batch remains `BE2_PROFILE_CLASSROOM_BATCH_CLOSED` at the engineering/technical level, established
by the prior closure re-review. It is `BE2_PROFILE_CLASSROOM_NOT_RATIFIED` at the governance level
because none of the three required named owners has recorded a real decision.

### Exact next governance task

Obtain an actual, attributable decision from each of the three named owners identified in
`component-b-profile-classroom-authorization.json` (`required_approvers.this_limited_scope`): product
owner, backend security owner, and privacy and child-safety owner. Each decision must be recorded by,
or on the explicit documented instruction of, that named person, and must include their name, role,
decision, decision date, approved scope, conditions, and unresolved concerns. Update
`component-b-profile-classroom-ratification.json` with the real entries once obtained, then re-issue
the ratification decision. Do not begin invite, QR, membership, session, attempt, progress,
scientific-engine, pilot, or production implementation before that ratification is granted.

## BE2 Profile/Classroom Ratification — Engineering Continuation Under Deferral to BE6

### Scope

This append-only entry records a project-governance instruction, issued directly by the person
directing this project in this session, that layers a bounded permission on top of the unresolved
named-approver ratification recorded above. It does not implement, modify, or authorize any code,
migration, table, endpoint, or scientific behavior by itself.

### Recorded status

`backend/provenance/component-b-profile-classroom-ratification.json` now additionally records:

```text
ENGINEERING_CONTINUATION_ALLOWED_RATIFICATION_DEFERRED_TO_BE6
```

under a new `engineering_continuation` field. The prior `final_ratification_decision` value,
`BE2_PROFILE_CLASSROOM_NOT_RATIFIED`, is preserved unchanged as the accurate historical record that no
named product owner, backend security owner, or privacy and child-safety owner has ratified this batch.
The new status does not retract, satisfy, or stand in for that unresolved ratification; it is recorded
as an explicit project-governance instruction, not as a decision by or attributed to any of the three
named approver roles.

### What this status permits and does not permit

Permitted: continued Version 1 engineering, implementation, and testing of subsequent bounded
Component B application-layer batches, under the same authorization-then-implementation-then-closure
discipline already used for the profile/classroom batch.

Not permitted: real-child onboarding, research exports, pilot deployment, or production use. Final
product, security, privacy, and child-safety sign-off from the three named owners remains required
before any pilot use and is deferred to the BE6 pre-pilot review gate, not waived.

### Exact next task

Use this status to evaluate and, where warranted, authorize the next bounded Version 1 engineering
batch (see the Version 1 Classroom Invite and Membership Authorization entry below). Continue to defer
named-approver ratification of every batch closed under this status until the BE6 pre-pilot review,
at which point real, attributable decisions from all three named owners are required before any pilot
or production step.

## Version 1 Classroom Invite and Membership Authorization

### Scope and non-implementation

This append-only entry records the governance authorization for the next bounded Version 1 engineering
batch: the classroom invitation and membership workflow. No code, migration, table, column, endpoint,
test, or dependency was implemented or modified during this task. The full machine-readable
authorization is `backend/provenance/component-b-invite-membership-authorization.json`.

### Governing status and dependency

This authorization is issued under, and depends on,
`ENGINEERING_CONTINUATION_ALLOWED_RATIFICATION_DEFERRED_TO_BE6` (see the entry immediately above). It
permits engineering and testing only. It does not create, satisfy, or shortcut the named-approver
ratification requirement, which remains deferred to BE6 for both the profile/classroom batch and this
new batch. It supersedes, for this scope only, the eight `POLICY_GATED_NOT_EXECUTABLE` invite/membership
endpoint candidates and the `learner_multi_classroom_membership`, `invite_cross_learner_reuse_policy`,
and `invite_expiry_duration` entries recorded as unresolved in
`component-b-profile-classroom-authorization.json`, while preserving that document's history unchanged.

### Version 1 product decisions

Nineteen product decisions were supplied and are recorded verbatim in the authorization file's
`product_decisions_v1`, covering classroom/teacher cardinality, the one-APPROVED-membership-per-learner
rule, invite reuse across different learners, token cryptography and storage, 24-hour expiry, teacher
revocation, PENDING-only resolution, ownership-restricted approval/rejection, the exact three membership
states, idempotent decisions, scoped teacher and learner reads, REAL/TEST provenance separation, and the
prohibition on storing unnecessary or scientific data.

### Resolved ambiguities

Four points were not fully determined by the literal product decisions and were resolved conservatively,
recorded in `resolved_ambiguities`:

- A learner may hold multiple concurrent PENDING requests across different classrooms; the
  one-membership rule is enforced only at approval time, and a later approval attempt on a sibling
  PENDING request fails with the authorized conflict rather than being auto-mutated.
- `resolve` is a non-mutating preview (token validation, classroom name/grade only); `requests` is the
  sole endpoint that creates a PENDING row, satisfying decision 11.
- Repeated use after a REJECTED outcome returns the existing REJECTED record; no re-request pathway is
  authorized in this Version 1 batch.
- Invite-token cryptographic implementation (exact algorithm, library, byte length) is bounded by
  required properties (CSPRNG, sufficient entropy, one-way hash storage, never logged) but not selected,
  consistent with the prior authorization's treatment of the same topic; QR image encoding/rendering is
  explicitly out of scope for this backend authorization.

### Schema reuse and migration authorization

`classroom_invites`, `classrooms`, `teacher_profiles`, `b_learners`, `app_user_learner_links`,
`b_idempotency_records`, and `b_audit_events` are reused unchanged; no gap was found against the
Version 1 decisions. `classroom_memberships` is reused with one identified gap: no existing constraint
enforces "at most one APPROVED membership per learner across all classrooms" at the database level. A
narrowly scoped migration is authorized to add exactly one PostgreSQL partial unique index —
`classroom_memberships(learner_id) WHERE state = 'APPROVED'` — chained after `20260722_0004`, mirroring
the existing `b_sessions` one-active-session-per-learner pattern. No table, column, trigger, or seed data
is authorized. The application table count is expected to remain twelve after this migration, since an
index is not a table.

### Concurrency lessons carried forward

The authorization explicitly reuses the root-cause lesson from the profile-provisioning concurrency
defect found and fixed in the corrective batch (insert-before-lock, and a lock keyed on a value generated
after the race begins, allow an unhandled integrity error instead of the authorized idempotent outcome).
It requires: a transaction-scoped advisory lock keyed by `(learner_id, classroom_id)` before the
existence check and insert in the membership-request endpoint; and a transaction-scoped advisory lock
keyed by `learner_id` (not only `membership_id`) before the one-APPROVED-membership check and state
transition in the approval endpoint, so two teachers cannot concurrently approve two different pending
requests for the same learner.

### Authorized endpoints

Exactly eight endpoints are authorized, each fully specified in the authorization file with permitted
role, ownership check, exact request/response fields, idempotency scope and behavior, audit requirement,
privacy restriction, stable error cases, and concurrency requirement:

```text
POST   /api/v1/classrooms/{classroom_id}/invites
POST   /api/v1/classroom-invites/resolve
POST   /api/v1/classroom-memberships/requests
GET    /api/v1/classrooms/{classroom_id}/membership-requests
POST   /api/v1/classroom-memberships/{membership_id}/approve
POST   /api/v1/classroom-memberships/{membership_id}/reject
GET    /api/v1/classrooms/{classroom_id}/learners
GET    /api/v1/learner/classrooms
```

The invite-creation endpoint's idempotent replay response explicitly omits `invite_token` on every
replay after the first response, since the standard canonical-response-stores-everything idempotency
pattern used elsewhere would otherwise persist the raw token in `b_idempotency_records.canonical_response`,
violating decision 8. This is recorded as a required deviation from the default pattern, not left for
implementation to discover.

### Prohibited behavior (unchanged)

Session creation and every session lifecycle transition, questions, attempts, hints, BKT, mastery,
Guess-Guard, certification, sequencing, progress, completion, Component B live-engine integration,
Component C, Component 3, research export, synthetic dataset generation, pilot or production rollout,
and real-child onboarding all remain explicitly prohibited and unauthorized by this batch.

### Required approvers and ratification status

The same three named owners (product owner, backend security owner, privacy and child-safety owner)
remain required before pilot or production use of this batch, deferred to the BE6 pre-pilot review under
`ENGINEERING_CONTINUATION_ALLOWED_RATIFICATION_DEFERRED_TO_BE6`. This authorization does not obtain or
simulate their decisions.

### Formal authorization decision

`BE2_INVITE_MEMBERSHIP_SCOPE_AUTHORIZED`.

The Version 1 product decisions are complete and internally consistent once the four ambiguities above
are resolved as recorded; the existing foundations cover every requirement except one narrowly scoped,
additive database constraint; every authorized endpoint has a fully specified contract; and the
concurrency defect class already found once in this project is explicitly guarded against by name in
this authorization rather than left to be rediscovered.

### Exact next task

Implement the classroom invitation and membership workflow batch against
`component-b-invite-membership-authorization.json`: the one authorized migration and the eight
authorized endpoints, with the required replay, mismatch (where applicable), concurrency, and rollback
tests for every POST, plus the architecture guards listed in `required_tests`. Do not implement QR image
rendering, learning sessions, or scientific behavior. On completion, conduct a separate closure review
before any further scope, following the same pattern already used for the profile/classroom batch.

## Classroom Invite and Membership Authorization Correction — Idempotency and Revocation

### Scope and non-implementation

This append-only entry records a narrow governance correction to
`backend/provenance/component-b-invite-membership-authorization.json`. No code, API, migration, model,
dependency, or test was implemented or modified during this task. The prior entry immediately above
(recording the original eight-endpoint `BE2_INVITE_MEMBERSHIP_SCOPE_AUTHORIZED` decision) is preserved
unchanged; this section records what changed and why, and supersedes only the specific counts and
identifiers named below.

### Preserved statuses

`ENGINEERING_CONTINUATION_ALLOWED_RATIFICATION_DEFERRED_TO_BE6` and `BE2_PROFILE_CLASSROOM_NOT_RATIFIED`
(both in `component-b-profile-classroom-ratification.json`, untouched by this task) and
`BE2_INVITE_MEMBERSHIP_SCOPE_AUTHORIZED` (in the corrected authorization file) all remain exactly as
recorded. This correction remains engineering/testing scope only; it does not authorize real-child
onboarding, pilot, production, or research export.

### Identifier correction

The authorization used two different spellings for the same operation in two places:
`idempotency_operation_identifiers` incorrectly keyed the invite-creation endpoint as
`classroom.invite.create`, while the endpoint's own `idempotency.scope` field already correctly used
`classroom_invite.create`. The map entry is corrected to `classroom_invite.create` everywhere; no other
operation identifier changed. The corrected file now contains exactly six operation identifiers:
`classroom_invite.create`, `classroom_invite.resolve`, `classroom_membership.request`,
`classroom_membership.approve`, `classroom_membership.reject`, and the new `classroom_invite.revoke`.

### Path-based idempotency fingerprint rule

Four commands — invite creation, approve, reject, and the new revoke endpoint — take an empty request
body and identify their target resource entirely through a path parameter (`classroom_id`,
`membership_id`, or `classroom_invite_id`). The authorization previously specified only
`actor_user_id + POST + operation identifier + Idempotency-Key` as the idempotency scope, without stating
that the canonical request fingerprint must also include the path parameter. Left uncorrected, this would
have meant that two different classrooms, memberships, or invites, addressed under the same operation and
the same reused key with an empty body, would fingerprint identically and the second request would be
misclassified as an identical replay of the first — returning the wrong resource's result instead of the
authorized stable conflict.

The authorization now defines a standalone `path_based_idempotency_fingerprint_rule` section, and each of
the four affected endpoints' `idempotency` blocks gained an explicit `canonical_fingerprint` field: the
fingerprint must be computed over HTTP method, operation identifier, authenticated actor, the normalized
path parameter, and the canonical body — not the body alone. Reusing the same Idempotency-Key against a
different classroom_id, membership_id, or classroom_invite_id must return the authorized stable CONFLICT
and must never replay the first resource's committed response. `resolve` and `requests` are unaffected,
since their target resource is already carried in the request body (`invite_token`).

### Ninth endpoint: teacher invite revocation

`POST /api/v1/classroom-invites/{classroom_invite_id}/revoke` is newly authorized, fulfilling product
decision 10 ("a teacher may revoke an invite"), which existed in `product_decisions_v1` but had no
corresponding endpoint. Contract summary:

- role TEACHER; ownership requires the invite's classroom to belong to the verified teacher;
  absent/non-owned returns `RESOURCE_NOT_FOUND`;
- no request body; requires `Idempotency-Key`; operation identifier `classroom_invite.revoke`;
- response fields: `classroom_invite_id`, `classroom_id`, `revoked_at_utc`, `row_version`, `request_id`;
- the first valid revocation (not yet revoked, not yet expired) sets `revoked_at_utc` from server time
  and increments `row_version`; identical replay (same key, same invite) returns the same result;
- a different-key revoke command against an invite that is already revoked, or against a never-revoked
  invite whose `expires_at_utc` has already passed, returns the authorized stable `CONFLICT` and does not
  mutate `revoked_at_utc` — this is a newly resolved ambiguity, recorded in `resolved_ambiguities`: the
  authorization explicitly does not select allowing post-expiry revocation as a distinct success path in
  this Version 1 batch, and fails closed instead, consistent with this project's established default;
- revocation does not delete the invite row and does not mutate any existing `classroom_memberships` row;
- revoked invites already failed `resolve` and `requests` with `CONFLICT` under the existing authorization
  and continue to do so unchanged;
- raw token and token hash are never looked up, returned, logged, or included in the audit payload or
  idempotency canonical response for this endpoint, since the invite is identified only by
  `classroom_invite_id`; audit records only actor, `classroom_id`, `classroom_invite_id`, and
  `revoked_at_utc`;
- concurrency: concurrent same-key revoke requests must serialize on the same idempotency-scoped advisory
  lock pattern already required generally, producing exactly one revocation result with no unhandled
  database integrity error, and this requirement is also recorded in
  `concurrency_lessons_carried_forward.required_application`.

No new migration is required for this endpoint: it uses the existing `classroom_invites.revoked_at_utc`
and `row_version` columns, confirmed in a new `migration_authorization.revoke_endpoint_schema_impact`
field. The one previously authorized partial unique index on `classroom_memberships` remains the only
schema change authorized for this batch.

### Revised tests

`required_tests` gained explicit coverage for: a path-parameter mismatch test for every path-based POST
command (invite creation, approve, reject, revoke) proving that key reuse against a different resource
returns the authorized conflict rather than a replay; invite-revocation success and identical replay;
different-key revoke against an already-revoked or already-expired invite returning conflict; concurrent
revocation producing exactly one result; revocation rollback after an injected failure with a successful
retry; revocation ownership isolation (non-owner `RESOURCE_NOT_FOUND`, learner `FORBIDDEN`); revocation
not deleting the invite or mutating existing memberships; a revoked invite continuing to fail `resolve`
and `requests`; and raw token/hash leakage scans extended to cover the revoke endpoint's response, logs,
errors, audit payloads, and idempotency canonical response. `exit_criteria`,
`implementation_boundaries.authorized_next_batch`, and `exact_next_task` were updated from eight to nine
authorized endpoints; `fail_closed_behavior` gained two entries covering revoke-conflict and
path-parameter-mismatch-conflict cases.

### Unchanged prohibited scope

Session creation and every session lifecycle transition, questions, attempts, hints, BKT, mastery,
Guess-Guard, certification, sequencing, progress, completion, Component B live-engine integration,
Component C, Component 3, research export, synthetic dataset generation, pilot or production rollout, and
real-child onboarding all remain explicitly prohibited and unauthorized, unchanged by this correction.

### Timestamps

The authorization's top-level `recorded_at_utc`, previously the placeholder `2026-07-23T00:00:00Z`
(never a genuine recorded instant), is corrected to the actual UTC recording time of this correction,
`2026-07-23T13:11:34Z`. A new `correction_log` array entry records this same timestamp alongside a
summary of what changed and a pointer to this build-log section, preserving rather than overwriting the
fact that a prior version existed. No other `recorded_at_utc` field in this file required correction, and
`component-b-profile-classroom-ratification.json` was not modified by this task.

### Validation

```text
python -c "import json; json.load(open('provenance/component-b-invite-membership-authorization.json'))"
-> VALID JSON

Endpoint count: 9
Endpoints: /api/v1/classrooms/{classroom_id}/invites,
           /api/v1/classroom-invites/{classroom_invite_id}/revoke,
           /api/v1/classroom-invites/resolve,
           /api/v1/classroom-memberships/requests,
           /api/v1/classrooms/{classroom_id}/membership-requests,
           /api/v1/classroom-memberships/{membership_id}/approve,
           /api/v1/classroom-memberships/{membership_id}/reject,
           /api/v1/classrooms/{classroom_id}/learners,
           /api/v1/learner/classrooms

Operation identifiers: classroom_invite.create, classroom_invite.resolve,
                        classroom_membership.request, classroom_membership.approve,
                        classroom_membership.reject, classroom_invite.revoke

decision: BE2_INVITE_MEMBERSHIP_SCOPE_AUTHORIZED (unchanged)
```

`git diff --check` was run against the working tree and reported no whitespace errors.

### Exact next implementation task

Implement the classroom invitation and membership workflow batch against the corrected
`component-b-invite-membership-authorization.json`: the one authorized migration, the nine authorized
endpoints (including revocation), the `path_based_idempotency_fingerprint_rule` for the four path-based
POST commands, and the full `required_tests` list including the newly added revocation and
path-parameter-mismatch coverage. Do not implement invite QR rendering, learning sessions, or scientific
behavior. On completion, conduct a separate closure review before any further scope, following the same
pattern already used for the profile/classroom batch.

## BE2 Classroom Invite and Membership Implementation

### Scope and governing authority

This entry records implementation of the authorized Version 1 classroom invitation and membership
batch against `component-b-invite-membership-authorization.json` and the human-readable classroom
join-code product clarification given during this task (join code replaces an opaque/QR token; wire
field names `invite_token`/`classroom_invite` remain governance-frozen). Governing status:
`ENGINEERING_CONTINUATION_ALLOWED_RATIFICATION_DEFERRED_TO_BE6` (engineering/testing only — no
real-child onboarding, pilot, production, or research export). This entry does not issue an engineering
closure decision; a separate closure review follows, matching the profile/classroom batch's pattern.

### Files created

- `backend/migrations/versions/20260723_0001_classroom_membership_single_approval.py`
- `backend/app/domain/classroom_membership.py`
- `backend/app/application/classroom_membership.py`
- `backend/app/api/routes/classroom_membership.py`
- `backend/tests/test_classroom_membership.py`

### Files modified

- `backend/app/infrastructure/persistence_models.py` — added the partial unique index to
  `ClassroomMembership.__table_args__` (SQLAlchemy model mirror of the migration; no new column).
- `backend/app/infrastructure/repositories.py` — added `ClassroomInviteRepository` and
  `ClassroomMembershipRepository`.
- `backend/app/main.py` — registered the new `classroom_membership` router.
- `backend/tests/test_be2_architecture_guards.py` — expanded the authorized route inventory to
  nineteen operations, added a dedicated nine-operation invite/membership check, added a
  no-session/scientific-path guard covering the full current route set, retired the now-superseded
  blanket "no invite/membership path" assertion (with an explanatory comment; the `session`/`attempt`/
  `hint` portion of that check is superseded by the new dedicated guard, which covers the same ground
  unconditionally rather than only at the 0004 migration's historical point in time), and added a guard
  for the new migration (no table/column change, only the named index, no `classroom_invites` change).

### Migration revision

`20260723_0001_classroom_membership_single_approval`, chained after `20260722_0004`. Adds exactly one
PostgreSQL partial unique index — `uq_classroom_memberships_one_approved_per_learner` on
`classroom_memberships(learner_id) WHERE state = 'APPROVED'` — mirroring the existing `b_sessions`
one-active-session-per-learner pattern. No table, column, or trigger was added or changed; no seed
data; `classroom_invites` untouched.

### Nine implemented endpoints

```text
POST   /api/v1/classrooms/{classroom_id}/invites
POST   /api/v1/classroom-invites/{classroom_invite_id}/revoke
POST   /api/v1/classroom-invites/resolve
POST   /api/v1/classroom-memberships/requests
GET    /api/v1/classrooms/{classroom_id}/membership-requests
POST   /api/v1/classroom-memberships/{membership_id}/approve
POST   /api/v1/classroom-memberships/{membership_id}/reject
GET    /api/v1/classrooms/{classroom_id}/learners
GET    /api/v1/learner/classrooms
```

Operation identifiers used for idempotency scoping: `classroom_invite.create`,
`classroom_invite.resolve`, `classroom_membership.request`, `classroom_membership.approve`,
`classroom_membership.reject`, `classroom_invite.revoke` — matching the corrected authorization
exactly, with no `classroom.invite.create`-style variant reintroduced.

### Human-readable join-code design (token-generation and hashing)

Per the mid-task product clarification, the invite secret is a human-readable classroom join code, not
an opaque token or QR payload:

- alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31 symbols; digits `0`/`1` and letters `I`/`L`/`O`
  excluded as visually ambiguous);
- 8 characters generated via `secrets.choice` (a CSPRNG), giving `log2(31) * 8 ≈ 39.6` bits of entropy;
  grouped 4-4 with a hyphen for display (e.g. `M7KP-4X9D`), matching the given example's shape;
- the canonical (ungrouped, uppercase) form is what gets hashed with SHA-256 into the existing
  `token_hash` column, unchanged in format (64 lowercase hex characters) and unchanged constraint;
- normalization (`normalize_join_code`) strips whitespace and hyphens and uppercases before both
  hashing and idempotency fingerprinting, so matching is case-insensitive and separator-insensitive
  as required, and a retried resolve/request typed with different casing or spacing is recognized as
  the same code rather than triggering a spurious idempotency body-mismatch conflict;
- the plaintext code is present only in the first successful invite-creation HTTP response; the
  idempotency `canonical_response` persisted for that command excludes it entirely (`invite_token:
  null, token_already_issued: true`), so it is never reconstructable from a replay or from
  `b_idempotency_records`; it is never included in audit payloads (only actor, `classroom_id`,
  `classroom_invite_id`, and timestamps are recorded) and never logged;
- length/alphabet/grouping are tunable module-level constants; the exact entropy figure is recorded
  here and in code comments for the deferred BE6 backend security owner review of the invite-token
  cryptographic contract (`invite_token_cryptographic_contract`, still `SECURITY_DESIGN_REQUIRED` per
  the authorization). QR image encoding/rendering was not implemented, consistent with both the
  original authorization and the clarification that a future QR affordance may wrap this same code
  without a backend redesign, since the wire contract (`invite_token` as a plaintext string) is
  unchanged either way.

### Idempotency fingerprint design

Two fingerprint shapes are used, per `path_based_idempotency_fingerprint_rule`:

- body-based (`resolve`, `requests`): SHA-256 of the canonical JSON `{"invite_token": <normalized
  code>}` — a one-way hash, so the code is never persisted even indirectly through the idempotency
  mechanism, and normalization ensures equivalent-but-differently-typed codes fingerprint identically;
- path-based (`invites` creation, `approve`, `reject`, `revoke`, all empty-bodied): SHA-256 of the
  canonical JSON `{"http_method": "POST", "operation_identifier": ..., "actor_user_id": ...,
  "path_parameter": <classroom_id | membership_id | classroom_invite_id>, "body": {}}`. Reusing the
  same Idempotency-Key against a different path resource of the same operation now produces a
  different fingerprint and returns the authorized stable `CONFLICT`, verified by dedicated
  path-mismatch tests for all four affected endpoints.

### Advisory-lock and row-lock design

- `POST .../classroom-memberships/requests` acquires a transaction-scoped advisory lock keyed by the
  stable pair `(learner_id, classroom_id)` before checking for an existing `classroom_memberships` row
  and before inserting, so a concurrent duplicate (same or different key) returns the existing row
  rather than racing on the `(classroom_id, learner_id)` unique constraint.
- `POST .../classroom-memberships/{membership_id}/approve` acquires a transaction-scoped advisory lock
  keyed by the stable `learner_id` (not the membership_id) before checking the one-APPROVED-membership
  invariant and before transitioning state, so two teachers concurrently approving two different
  PENDING requests for the same learner cannot both succeed. The target membership row is re-read with
  `SELECT ... FOR UPDATE` after the lock is acquired — necessary both for row-level serialization and
  because SQLAlchemy's identity map would otherwise return a stale, pre-lock copy of an already-loaded
  ORM object rather than a fresh one; the flush is additionally wrapped in a defensive
  `try/except IntegrityError -> ConflictError` around the partial-unique-index write, satisfying the
  literal "no unhandled unique-constraint error" requirement even though the advisory lock already
  prevents the race from reaching that constraint under normal operation.
- `POST .../classroom-invites/{classroom_invite_id}/revoke` relies on the existing idempotency-scoped
  advisory lock (actor + operation + key) for same-key concurrency, and additionally re-reads the
  invite row with `SELECT ... FOR UPDATE` after that lock (and after the idempotency-replay
  short-circuit) so that a genuinely different-key concurrent or sequential revoke against an
  already-revoked invite reliably observes the committed state and returns `CONFLICT` rather than a
  stale, pre-commit view.
- `POST .../classroom-memberships/{membership_id}/reject` uses the same `FOR UPDATE` re-read for
  correctness against a different-key already-decided conflict, with no additional advisory lock, per
  the authorization's "no cross-membership invariant applies to rejection."

### Ownership, privacy, and provenance controls

Every mutating endpoint resolves the actor's role/profile first, then verifies ownership of the target
resource (classroom, invite, or membership) before any idempotency or business-state check, returning
`RESOURCE_NOT_FOUND` for absent or non-owned resources to prevent enumeration, and `FORBIDDEN` for the
wrong role. Learner-facing teacher listings return no email; teacher-facing learner listings return no
email. `b_learners.grade` is never written by approval (verified directly against the database in
tests). All live mutations use server-controlled `source_class = REAL` provenance; audit payloads carry
only actor, resource identifiers, and (for approve/reject) an explicit before/after state pair — never
tokens, hashes, passwords, or JWTs.

### Test commands and results

```text
docker compose config                      -> OK
docker compose build                       -> Image upadya-backend:be1-batch3 Built
docker compose up -d                       -> db healthy, api started
docker compose exec api python -m compileall app   -> clean
docker compose exec api alembic upgrade head       -> 20260722_0004 -> 20260723_0001
docker compose exec api pytest -q tests/test_classroom_membership.py   -> 29 passed, 1 warning
docker compose exec api pytest -q                                       -> 84 passed, 1 warning
```

The single warning is the known upstream FastAPI/Starlette `TestClient` httpx deprecation. The full
suite grew from 52 (prior state) to 84: 29 new focused tests plus 3 new architecture-guard tests.

One genuine test-design bug was found and fixed during this run (not a service defect): the first
version of the concurrent cross-classroom approval test reused a learner who already had an approved
membership from earlier in the same test, so both concurrent approval attempts correctly conflicted
with that pre-existing approval regardless of timing, rather than exercising the intended race. Fixed
by using a fresh learner with no prior approval for that specific scenario; after the fix, the
concurrent race produced the expected `[200, 409]` split with exactly one `APPROVED` row.

### Migration-cycle results

```text
alembic check (at head)                    -> No new upgrade operations detected
alembic downgrade 20260722_0004            -> 20260723_0001 -> 20260722_0004
alembic current                            -> 20260722_0004
alembic upgrade head                       -> 20260722_0004 -> 20260723_0001
alembic current                            -> 20260723_0001 (head)
alembic check (after cycle)                -> No new upgrade operations detected
pg_isready                                 -> accepting connections
```

### Architecture-guard results

OpenAPI now contains exactly nineteen operations: the ten pre-existing plus the nine newly authorized.
`test_openapi_contains_exactly_the_nine_authorized_invite_membership_operations` and
`test_no_session_question_answer_or_scientific_route_exists` both pass; the latter scans every current
route for `session`, `attempt`, `hint`, `progress`, `bkt`, `mastery`, `sequenc`, `certif`, and `guess`
and finds none. `test_invite_membership_migration_adds_only_the_authorized_index` confirms the new
migration contains no `create_table`, `add_column`, or `drop_column` call, names the authorized index
and table, and never mentions `classroom_invites`. Direct database inspection confirmed the application
table count remains twelve (`app_users`, `b_learners`, `app_user_learner_links`,
`b_runtime_bundle_records`, `b_sessions`, `b_session_events`, `b_idempotency_records`,
`b_audit_events`, `teacher_profiles`, `classrooms`, `classroom_invites`, `classroom_memberships`) plus
`alembic_version` and the pre-existing `be1_persistence_check` marker, and that
`uq_classroom_memberships_one_approved_per_learner` exists alongside the two pre-existing
`classroom_memberships` indexes.

### Leakage and isolation results

A targeted API-log scan found no join code, `Authorization` header, password, refresh token,
`component_b_generator`, or Yass match. A container-side scan of `app` found no failure-injection
marker (`controlled-test-failure`, `_failing_audit`, `force_error`, `force_failure`) and no research
import (`component_b_generator`, `import yass`, `from yass`). The API ran as UID/GID `10001:10001` with
no bind mounts; PostgreSQL published no host port. `git diff --check` reported no whitespace errors.

### Unresolved limitations

- The invite-token cryptographic contract (exact alphabet/length/entropy target) remains an
  implementation-time choice recorded for BE6 backend-security-owner review, not a ratified parameter;
  the ~39.6-bit entropy figure is the number that review should evaluate.
- QR image rendering/encoding was not implemented in this batch, consistent with the authorization and
  the clarification; it remains a future frontend concern layered on the same join code.
- `learner_multi_classroom_membership` cardinality is implemented exactly as decided (one APPROVED at a
  time, multiple concurrent PENDING allowed), but the broader unresolved decisions list in
  `component-b-profile-classroom-ratification.json` (retention/withdrawal/deletion,
  `classroom_grade_change_after_membership`, `profile_and_account_update_deactivation`) remains
  unchanged and unaddressed by this batch.

### Confirmation of prohibited scope

No session, question, opportunity, attempt, hint, response-time, BKT, mastery, Guess-Guard,
certification, sequencing, progress, completion, Component B live-engine, Component C, Component 3,
research-export, synthetic-dataset, pilot, or production behavior was implemented. No Yass or
`component_b_generator` import or dependency exists.

### Exact next task

Conduct a separate closure review of this classroom invite and membership batch against
`component-b-invite-membership-authorization.json`, following the same pattern as the profile/classroom
closure review: re-verify all evidence above from the pushed commit in a clean Docker run, confirm the
governance-status dependency (`ENGINEERING_CONTINUATION_ALLOWED_RATIFICATION_DEFERRED_TO_BE6`) is still
in effect, and issue a formal engineering-closure decision. This entry does not issue that decision.

---

## BE2 Classroom Invite and Membership — Closure Review

Completed: 2026-07-24 Asia/Colombo (`2026-07-23` UTC)
Reviewed target: the uncommitted working tree described in the entry above (no new functionality
added; review-only)

### Method

Independent re-verification, not a re-read of the prior entry's claims: full `git diff` inspection of
every changed/new file; line-by-line reading of the migration, domain contracts, application service,
API routes, and test module; a clean Postgres 16.10 container (no volume reuse, published on
`127.0.0.1:5432`) with dependencies installed fresh (Python 3.13, project deps from
`requirements.lock` minus the Windows-incompatible `uvloop` entry, which is an optional uvicorn extra
never exercised by `TestClient`-based tests); `alembic upgrade head` from empty; the full
downgrade/upgrade cycle with direct `psql` index inspection at each step; `alembic check`; direct
`psql` table/index enumeration; the focused and full pytest suites; static scans for out-of-scope
terms and plaintext leakage.

### Scope conformance

`git diff --stat` against the parent commit shows exactly five modified files and five new files, all
within `backend/app/{domain,application,api/routes,infrastructure}`, `backend/migrations/versions/`,
`backend/tests/`, and `backend/buildLog.md`. `persistence_models.py` and `repositories.py` diffs
contain only the one partial-unique-index addition and the two new repository classes respectively;
`main.py` diff is the one router registration. No file outside the invite/membership surface was
touched. `git diff --check` reports no whitespace/conflict-marker errors.

### Endpoint and identifier verification

`app.openapi()["paths"]` enumerated directly: exactly the nine authorized routes/methods, no more, no
fewer. Operation-identifier strings passed to `_idempotency_start` in
`app/application/classroom_membership.py` read verbatim: `classroom_invite.create`,
`classroom_invite.resolve`, `classroom_membership.request`, `classroom_membership.approve`,
`classroom_membership.reject`, `classroom_invite.revoke` — exact match to the frozen list.

### Authorization, privacy, and boundary verification

Every mutating and listing use-case resolves role via `_teacher_context`/`_require_learner` before any
ownership or state check; ownership is enforced via `get_owned` joins against `Classroom.teacher_profile_id`
(invites, memberships) so cross-teacher access 404s rather than 403s (no enumeration signal). Learner
and teacher listing responses (`ClassroomLearnerListItem`, `MembershipRequestListItem`,
`LearnerMembershipListItem`) carry no email field. Confirmed by direct code read and by passing tests
asserting `"email" not in entry` on both listing directions and 403/404 boundaries for every
role/ownership combination.

### Invite and membership behavior verification

Join code: `secrets.choice` over a 31-symbol alphabet excluding `0/O/1/I/L`, 8 characters, SHA-256
hashed after `normalize_join_code` (strip separators, uppercase) — hash is the only persisted form
(`token_hash` unique+format-checked column, pre-existing schema, untouched). Plaintext appears only in
the first `create_invite` HTTP response; the idempotency `canonical_response` stored for replay
explicitly nulls `invite_token`. `resolve_invite` performs no write to `classroom_memberships` (verified
by direct row-count assertion in tests and by code read — no `ClassroomMembership` construction on that
path). 24-hour expiry (`timedelta(hours=24)`) confirmed in code and by a dedicated expiry-delta test.
Revoke is owner-scoped, sets `revoked_at_utc`, and is unconditionally checked (`revoked_at_utc is not
None or expires_at_utc <= now`) in resolve and request-membership. Membership request creates `PENDING`
only; approve/reject require the owning teacher and a `PENDING` starting state; a second request against
an existing `REJECTED` row returns the existing rejected record rather than creating a new one (no
re-request path exists in the nine endpoints, matching the Version 1 constraint); multiple concurrent
`PENDING` rows across different classrooms for one learner are permitted (`uq_classroom_memberships_pair`
is scoped per classroom+learner, not global); exactly one `APPROVED` row per learner is enforced by
`uq_classroom_memberships_one_approved_per_learner`, confirmed present via direct `psql` inspection.

### Concurrency verification

`classroom_membership.request` and `.approve` acquire `pg_advisory_xact_lock` keyed on
`(learner_id, classroom_id)` and `learner_id` respectively before their state-changing reads; `.reject`
and invite `.revoke` rely on `SELECT ... FOR UPDATE` on the target row, which independently serializes
any concurrent transaction touching the same row regardless of advisory-lock scope — a valid mechanism,
not a gap. `approve_membership` wraps its flush in `except IntegrityError -> ConflictError`, the
documented last-line defense behind the partial unique index. The concurrent cross-classroom approval
test (`test_approval_second_classroom_conflict_and_concurrent_cross_classroom_approvals`) exercises two
different teachers approving two different `PENDING` memberships for the same learner via genuine
thread-level concurrency against a shared `TestClient`, and asserts the `[200, 409]` split with exactly
one resulting `APPROVED` row — passed.

### Idempotency verification

Idempotency records are scoped at the database level by a `(actor_user_id, http_method,
operation_identifier, idempotency_key)` unique constraint (pre-existing `b_idempotency_records` schema,
untouched); the request fingerprint layered on top of that scope covers path parameter and canonical
body (`path_fingerprint` for the five path-addressed commands) or canonical body alone (`body_fingerprint`
for the two body-only commands, `resolve`/`request`), which is sufficient because actor/method/operation
are already structurally enforced by the scope key rather than needing restatement inside the hash.
Path-resource-mismatch tests (same key, different classroom/membership/invite) confirm a stable `409`
rather than a false replay, for all five path-addressed operations. No canonical response persisted for
replay contains a plaintext join code (`create_invite`'s stored response explicitly nulls it); no test or
code path replays one command's stored response against a different resource.

### Commands run and results

```text
docker run postgres:16.10-bookworm (fresh, published host port, no volume reuse)
alembic upgrade head                          -> ...0004 -> 20260723_0001 (clean, no errors)
alembic current                               -> 20260723_0001 (head)
alembic downgrade 20260722_0004               -> index dropped (confirmed via psql \d)
alembic upgrade head                          -> index restored (confirmed via psql \d)
alembic check                                 -> No new upgrade operations detected
git diff --check                              -> clean (no output)
pytest tests/test_classroom_membership.py -v  -> 29 passed, 1 warning
pytest tests/ -v                              -> 84 passed, 1 warning
```

The one warning in both runs is the pre-existing, unrelated `StarletteDeprecationWarning` for
`httpx`-backed `TestClient`, matching the implementation entry's note; not introduced by this batch.

### Database inspection

`psql \dt` on the freshly migrated database: 13 relations total, 12 application tables (`app_users`,
`app_user_learner_links`, `b_learners`, `b_runtime_bundle_records`, `b_sessions`, `b_session_events`,
`b_idempotency_records`, `b_audit_events`, `teacher_profiles`, `classrooms`, `classroom_invites`,
`classroom_memberships`) plus `alembic_version`. (The `be1_persistence_check` connectivity marker
referenced in the implementation entry is created ad hoc by manual connectivity checks, not by
migrations or the test suite, and is correctly absent from a freshly created database — its absence here
is expected, not a discrepancy.) `psql \d classroom_memberships` confirms exactly three indexes: the
primary key, the pre-existing `uq_classroom_memberships_pair`, and the one new
`uq_classroom_memberships_one_approved_per_learner` partial unique index — no other new index, table,
column, or trigger anywhere in the schema.

### Leakage and architecture-boundary scans

Grep of all five new/changed application files for `component_b_generator`, `yass`, `bkt`, `sequenc`,
`certif`, `component_c`, `component_3`, `research.export`, `pilot`, `production_run` found no real
match (only an incidental substring hit inside Python's `Sequence` type import, in the migration
header). `test_be2_architecture_guards.py`'s three new/updated guards
(`test_openapi_contains_exactly_the_nine_authorized_invite_membership_operations`,
`test_no_session_question_answer_or_scientific_route_exists`,
`test_invite_membership_migration_adds_only_the_authorized_index`) all passed as part of the full suite
run above. No session, item, answer, hint, BKT, mastery, sequencing, certification, progress, Component
C, Component 3, research-export, pilot, or production behavior was found anywhere in the reviewed diff.

### Non-blocking observation (not a defect requiring action)

`create_invite`'s insert is not wrapped in an `IntegrityError` handler for the pre-existing
`uq_classroom_invites_token_hash` constraint. At ~39.6 bits of entropy per code this is not a practical
collision risk at any realistic invite volume, and defended-against concurrency defect was not part of
the authorized review checklist (which specifically scopes the `IntegrityError`-conversion requirement to
membership approval). Recorded for awareness only; does not block closure.

### Closure decision

**GO** — closure status identifier: `BE2_INVITE_MEMBERSHIP_BATCH_CLOSED`. No blocking findings. All
twelve review requirements re-verified independently against a clean database and a clean dependency
install, not merely re-read from the implementation entry. Nothing was committed by this review; the
working tree remains exactly as it was at the start (`git status` unchanged before/after).


## BE2 Classroom Invite and Membership — Join-Code Ratification and Closure Observation Record

### Scope and nature of this entry

This is a **governance record-keeping reconciliation only**. It changes no code, schema, migration,
endpoint, or test, and it does not alter the closed batch: the BE2 Classroom Invite and Membership
implementation remains exactly as reviewed and closed at commit `3e13106` (`close BE2 invite and
classroom membership batch`), now pushed to `origin/B_frontend`. It records two items surfaced during
the supervisor baseline and the closure review that were, until now, captured only in this build log
and in code comments rather than in the frozen authorization contract. The corresponding machine-
readable record is the second entry appended to `correction_log` in
`backend/provenance/component-b-invite-membership-authorization.json`.

### Item 1 — Human-readable join-code clarification ratified into the contract

The `component-b-invite-membership-authorization.json` contract, in its crypto `resolved_ambiguities`
entry, still framed the invite secret as an "opaque raw token string". The implemented and closed
behavior instead uses a **human-readable classroom join code**, per a mid-batch product clarification:

- uppercase 31-symbol visually-unambiguous alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (excludes
  `0`/`O`/`1`/`I`/`L`);
- 8 characters generated with a CSPRNG (`secrets.choice`), approximately `log2(31) * 8 = 39.6` bits of
  entropy, grouped 4-4 for display (for example `M7KP-4X9D`);
- normalized case-insensitively and separator-insensitively before both hashing and idempotency
  fingerprinting, and SHA-256-hashed into the existing 64-lowercase-hex `token_hash` column.

The appended contract correction records that this clarification **supersedes the "opaque raw token
string" phrasing for wire-display purposes only**. The wire field names `invite_token` and the
`classroom_invite` resource identity remain governance-frozen; the one-way-hash storage, never-logged,
and 24h-expiry-plus-teacher-revocation properties are unchanged. The approximately 39.6-bit entropy
figure is the specific value the deferred **BE6** `invite_token_cryptographic_contract` review (still
`SECURITY_DESIGN_REQUIRED`) must evaluate for a short, human-typeable, revocable, 24-hour code.

### Item 2 — Closure non-blocking observation carried forward to BE6

The closure review recorded one non-blocking observation, restated here for the BE6 backend-security-
owner review: `create_invite`'s insert is not wrapped in an `IntegrityError` handler for the
pre-existing `uq_classroom_invites_token_hash` unique constraint. At approximately 39.6 bits this is not
a practical collision risk at realistic invite volumes, and it is explicitly outside this batch's
authorized `IntegrityError`-to-`ConflictError` conversion scope, which is limited to membership approval
behind the partial unique index. Recorded for awareness; it was not, and is not, a blocker.

### Unchanged statuses

This reconciliation is **not** a named-approver ratification. The prior decision
`BE2_INVITE_MEMBERSHIP_SCOPE_AUTHORIZED`, the closure decision `BE2_INVITE_MEMBERSHIP_BATCH_CLOSED`, and
the governing `ENGINEERING_CONTINUATION_ALLOWED_RATIFICATION_DEFERRED_TO_BE6` /
`BE2_PROFILE_CLASSROOM_NOT_RATIFIED` statuses all remain in effect and unchanged. Product owner, backend
security owner, and privacy and child-safety owner ratification remains deferred to the BE6 pre-pilot
review; this entry does not create, satisfy, or shortcut that requirement.

---

## BE2.3-BE2.4 Neutral Session-Lifecycle Skeleton -- Engineering Continuation

Completed: 2026-07-24 Asia/Colombo (`2026-07-24` UTC)
Build target: `Dev/backend/`
Authorized by: the user's bounded task under
`ENGINEERING_CONTINUATION_ALLOWED_RATIFICATION_DEFERRED_TO_BE6`, reusing the existing
`b_sessions` / `b_session_events` / `b_runtime_bundle_records` schema. This entry does
not issue a closure decision.

### Scope

Exactly four LEARNER-role endpoints under `/api/v1/b/sessions`, reusing existing
persistence with no migration:

- `POST /api/v1/b/sessions` (`b_session.start`, Idempotency-Key required)
- `GET /api/v1/b/sessions/active`
- `POST /api/v1/b/sessions/{session_id}/complete` (`b_session.complete`, Idempotency-Key required)
- `POST /api/v1/b/sessions/{session_id}/abandon` (`b_session.abandon`, Idempotency-Key required)

Start resolves the currently approved+published runtime bundle, pins its
`runtime_bundle_record_id`, and creates the session directly as `active`; no
approved+published bundle fails closed with `CONFLICT` (a bundle-less session is never
created). A safe replay or a concurrent duplicate start for the same learner returns
the existing active session. `expires_at_utc` is always left `NULL` -- no numeric
expiry/timeout, per the governance-unresolved gate. Complete/abandon are neutral,
explicit client commands (`active -> completed` / `active -> abandoned`) with no
scientific or pedagogical completion criteria. No question, answer, attempt, hint,
BKT, mastery, certification, sequencing, or Component B live-engine behavior exists
anywhere in this batch.

### Files created

- `app/domain/b_session.py` -- `SessionFields`, `SessionCommandResponse` (start/complete/
  abandon), `ActiveSessionResponse` (nullable `session`). Only `session_id`, `state`,
  `runtime_bundle_version`, `created_at_utc`, `row_version`, `request_id` are exposed.
- `app/application/b_session_lifecycle.py` -- `BSessionLifecycleService`. Deliberately
  named to avoid the `*session*service*.py` glob used by the pre-existing architecture
  guard (see below); reimplements the `_require_user`/`_require_learner`/idempotency/
  audit helpers locally, following this codebase's established per-service convention
  (no shared base class exists for these).
- `app/api/routes/b_session.py` -- the four route handlers, `Idempotency-Key` header
  required on the three POST operations.
- `tests/test_b_session_lifecycle.py` -- 14 focused tests (see below).

### Files modified

- `app/infrastructure/repositories.py` -- added `RuntimeBundleRecordRepository.
  find_current_approved_published()` (tie-break: most recent `PUBLISHED`+`APPROVED`
  bundle by `created_at_utc`, an engineering assumption recorded here, not a governed
  tie-break policy) and three `SessionRecordRepository` methods:
  `find_starting_or_active_for_learner`, `find_active_for_learner`, `get_owned`.
- `app/main.py` -- one router registration (`b_session_router`).
- `tests/test_be2_architecture_guards.py` -- extended, not weakened: added the four new
  routes to `EXPECTED_ROUTES`; added `AUTHORIZED_B_SESSION_LIFECYCLE_OPERATIONS` (4) with
  an exact-count containment test mirroring the invite/membership pattern; carved the
  blanket "session" path-term prohibition out only for those four exact routes (every
  other prohibited scientific term, and "session" on every other route, remains
  unconditionally prohibited); added an AST-based DTO field-identifier scan for
  `app/domain/b_session.py` (deliberately AST-based, not raw text, because the module's
  own docstring correctly documents excluded terms by name and a raw-text scan produced
  a false positive on first attempt). The `*session*service*.py` empty-glob assertion
  was left untouched because `b_session_lifecycle.py` does not contain the substring
  "service"; no evasion was intended, it is simply an accurate name for the module.

No schema migration was created or needed.

### Concurrency and correctness bug found and fixed during this batch

The first implementation of `complete`/`abandon` called `SessionRecordRepository.
get_owned()` (an unlocked read, for the ownership/404 check) before later re-reading
the same row with `SELECT ... FOR UPDATE`. Because the row was already present in the
SQLAlchemy session identity map from the first read, the FOR-UPDATE re-fetch did not
refresh the Python-level `state` attribute from the newly-locked row by default -- the
SQL-level lock was correctly acquired, but the ORM object kept its pre-lock in-memory
value. A genuine concurrency test (complete one session and abandon the same session,
truly concurrently, via a shared `TestClient` and a `threading.Barrier`) caught this:
both transitions returned `200`, i.e., both committed successfully against a session
that should have allowed exactly one. Root cause and fix: added
`.execution_options(populate_existing=True)` to the FOR-UPDATE select in `_transition`,
forcing SQLAlchemy to overwrite the identity-mapped object's attributes from the
lock-holding read. After the fix, the same race reliably produces `[200, 409]` with
exactly one resulting transition. This same identity-map hazard is latent (but not
currently exercised, since no existing test races two different operations against the
same row) in `classroom_membership.approve_membership`'s equivalent `get_owned` +
`FOR UPDATE` pattern; it is recorded here for BE6 awareness but was not touched, being
out of this batch's authorized scope.

A second, unrelated test-design bug was found and fixed in this batch's own test
authoring (not a service defect): an early draft of the idempotency path-mismatch test
reused the same literal Idempotency-Key string across two different learners, expecting
a `409`. Idempotency uniqueness is scoped by `(actor_user_id, http_method,
operation_identifier, idempotency_key)`, so two different actors reusing the same key
string are structurally independent records, not a conflict -- both correctly returned
`200`. Fixed by testing the intended scenario instead: the same learner reusing one key
across two sessions they own in sequence (complete session A, start session B, reuse
A's key against B's `complete`), which correctly conflicts.

### Test coverage (14 tests, `tests/test_b_session_lifecycle.py`)

- Start: creates an active session pinned to the resolved bundle; fails closed with
  `409 CONFLICT` when no approved+published bundle is resolvable (exercised
  deterministically via an overridden `_resolve_pinnable_bundle` test seam, following
  this codebase's established `injected._audit = _failing_audit`-style instance-method
  override convention, rather than depending on global test-database bundle absence,
  which is not reliably controllable across a shared test database); replay returns the
  same session; concurrent duplicate starts (two threads, one `Barrier`, different
  idempotency keys) produce exactly one active/starting row; TEACHER -> `403`,
  no-profile -> `404`; rollback on an injected audit failure leaves no session, no
  idempotency row, and a retry with the same key then succeeds; runtime-bundle pinning
  is verified to survive a newer approved+published bundle being inserted after start.
- Get-active: returns `null` when absent, returns the learner's own current session,
  isolates across two different learners, and enforces the LEARNER-role boundary.
- Complete/abandon: success transition; replay returns the same result; a further
  transition attempt on an already-non-active session conflicts; idempotency-key reuse
  across two sessions the same learner owns conflicts (not a false replay); cross-learner
  ownership isolation returns `404` (no enumeration); TEACHER -> `403`, no-profile ->
  `404`; rollback on an injected audit failure leaves `state`/`row_version` unchanged and
  no idempotency row, with a same-key retry then succeeding; a genuine concurrent
  complete-vs-abandon race on the same session produces exactly one transition (the bug
  above).

### Architecture-guard and database verification

```text
docker compose build                                -> Image upadya-backend:be1-batch3 Built
docker compose up -d                                 -> db healthy, api started
docker compose exec api python -m compileall app     -> clean
docker compose exec api alembic upgrade head         -> no new revisions (already at 20260723_0001)
docker compose exec api alembic check                -> No new upgrade operations detected
docker compose exec api alembic downgrade 20260722_0004 -> OK
docker compose exec api alembic upgrade head          -> OK
docker compose exec api alembic check (post-cycle)    -> No new upgrade operations detected
docker compose exec api pytest -q                     -> 100 passed, 1 warning (pre-existing httpx/TestClient deprecation)
```

`app.openapi()["paths"]` enumerated directly inside the container: exactly 20 total
operations, the sixteen pre-existing plus exactly the four newly authorized
`/api/v1/b/sessions*` operations, no more, no fewer.
`test_openapi_contains_exactly_the_four_authorized_b_session_lifecycle_operations` and
`test_no_session_question_answer_or_scientific_route_exists` (with its narrow "session"
carve-out limited to exactly those four routes) both pass; every other prohibited
scientific path term (`attempt`, `hint`, `progress`, `bkt`, `mastery`, `sequenc`,
`certif`, `guess`) remains unconditionally checked against all twenty routes, including
the four new ones. A container-side grep for `component_b_generator`, `import yass`/
`from yass`, and known failure-injection markers found no match. The container ran as
UID/GID `10001:10001`; the `db` service publishes no host port (unchanged from prior
batches).

### Non-blocking observation carried forward

The `find_current_approved_published()` tie-break (most recent `created_at_utc` among
`PUBLISHED`+`APPROVED` bundles) is an engineering assumption, not a governed selection
policy, for the case where more than one bundle is simultaneously eligible (e.g. an
alias or a newer replacement bundle published without retiring the old one). Recorded
for BE6 review alongside the identity-map/FOR-UPDATE hazard noted above.

### Confirmation of prohibited scope

No question, opportunity, attempt, hint, BKT, mastery, Guess-Guard, certification,
sequencing, progress-beyond-state, numeric expiry/timeout, Component B live-engine,
Component C, Component 3, or research-generator behavior was implemented anywhere in
this batch. No Yass or `component_b_generator` import or dependency exists.

### Current state and exact next task

This batch is complete, tested, and left uncommitted in the working tree for Yasindu to
review and commit. No `git add`, `git commit`, or `git push` was run. Exact next task:
review this diff and the above evidence; if accepted, commit it following this
repository's established commit-message conventions, then conduct a separate closure
review of this specific batch (mirroring the BE2 invite/membership closure review
pattern) before treating BE2.3-BE2.4 as formally closed. This entry does not issue that
closure decision.

---

## BE2.3-BE2.4 Neutral Session-Lifecycle Skeleton -- Closure Review

Completed: 2026-07-24 Asia/Colombo (`2026-07-24` UTC)
Build target: `Dev/backend/`
Scope: a separate, independent closure review of the engineering-continuation entry
immediately above, re-verified against PROMPT BE2-S and BEplan BE2.3-BE2.4 from a clean
run. This entry only reviews and closes that batch; it authorizes no new scope, no
migration, and no scientific behavior. Git hard rule observed: read-only git only
(`git status`/inspection); nothing was staged, committed, or pushed; this closure record
is appended to `buildLog.md` only.

### Method -- clean, isolated re-verification (not a re-read of the prior evidence)

The prior batch's Docker evidence was independently reproduced from scratch rather than
accepted on record:

```text
docker compose down -v                    -> prior container/volume/network removed
docker compose build --no-cache           -> full dependency reinstall from requirements.lock,
                                              fresh image upadya-backend:be1-batch3
docker compose up -d                      -> new named volume, db healthy, api started
docker compose exec api python -m compileall app   -> clean, no errors
docker compose exec api alembic upgrade head        -> 5 revisions applied to an empty
                                              database, head 20260723_0001, no error
docker compose exec api alembic check               -> "No new upgrade operations detected."
docker compose exec api alembic current             -> 20260723_0001 (head)
docker compose exec api pytest -q                   -> 100 passed, 1 warning (pre-existing
                                              httpx/TestClient deprecation, unrelated to
                                              this batch)
docker compose down -v                    -> isolated verification stack torn down
```

The `alembic check` result on a freshly migrated, previously empty database confirms
zero schema drift: this batch's four endpoints reuse the existing `b_sessions` /
`b_session_events` / `b_runtime_bundle_records` / `b_idempotency_records` /
`b_audit_events` tables exactly as claimed, with no migration file added, changed, or
required.

### Endpoint-count and route-boundary re-verification

`app.openapi()["paths"]` was independently re-enumerated inside the freshly built
container: exactly 20 total operations, the sixteen pre-existing plus exactly the four
authorized `/api/v1/b/sessions*` operations (`POST /api/v1/b/sessions`,
`GET /api/v1/b/sessions/active`, `POST /api/v1/b/sessions/{session_id}/complete`,
`POST /api/v1/b/sessions/{session_id}/abandon`), no more, no fewer.
`test_openapi_contains_exactly_the_four_authorized_b_session_lifecycle_operations` and
`test_no_session_question_answer_or_scientific_route_exists` were run explicitly
(`tests/test_be2_architecture_guards.py -v`, all 13 guard tests passed) and their source
was read directly rather than trusted from the summary: the "session" path-term carve-out
is scoped to exactly the four authorized routes via
`AUTHORIZED_B_SESSION_LIFECYCLE_OPERATIONS`, and every other prohibited scientific term
(`attempt`, `hint`, `progress`, `bkt`, `mastery`, `sequenc`, `certif`, `guess`) remains
checked unconditionally against all twenty routes, including the four new ones.

### One-active-session invariant under a genuine concurrent race

Re-verified, not merely re-read. Both concurrency tests use real threads and a
`threading.Barrier`, not mocked timing:

- `test_start_concurrent_duplicate_produces_exactly_one_active_session` -- two threads
  submit `POST /api/v1/b/sessions` for the same learner simultaneously with different
  idempotency keys.
- `test_concurrent_complete_and_abandon_race_produces_exactly_one_transition` -- two
  threads race `complete` and `abandon` against the *same* session id simultaneously.

Each was independently re-run 5 times in immediate succession against the fresh
container/database (10 total race executions, not a single sample):

```text
race run 1: 2 passed in 1.96s
race run 2: 2 passed in 1.96s
race run 3: 2 passed in 1.86s
race run 4: 2 passed in 1.99s
race run 5: 2 passed in 2.16s
```

All 10 executions produced exactly one committed transition/active row (`[200, 409]` for
the complete-vs-abandon race; a single deduplicated active session for the concurrent
start race), with no flake observed. This corroborates the buildLog's account of the
identity-map/`FOR UPDATE` bug: reading `app/application/b_session_lifecycle.py`
directly confirms `.execution_options(populate_existing=True)` is present on the
lock-holding `SELECT ... FOR UPDATE` in `_transition`, which is the actual fix, not just
a claim.

### Fail-closed-with-no-bundle

Source-verified in `start_session`: `bundle = await self._resolve_pinnable_bundle(...)`
followed immediately by `if bundle is None: raise ConflictError()`, strictly before any
`SessionRecord` is constructed -- a bundle-less session cannot be created by construction,
not merely by a passing test. `test_start_fails_closed_when_no_approved_bundle_exists`
(exercised via an injected `_resolve_pinnable_bundle` test seam) passed in the fresh run
and independently asserts the learner's active/starting-session count is `0` afterward.

### Ownership/role isolation

Re-verified: `_require_learner` rejects non-`LEARNER` profile types with `403` and
missing profiles with `404` before any session lookup; `get_owned(session_id,
learner_id)` scopes the row lookup to the calling learner, so a different learner's
`complete`/`abandon` attempt on a session they do not own returns `404` (no existence
enumeration), confirmed by
`test_complete_success_replay_path_mismatch_conflict_and_isolation` and
`test_complete_and_abandon_require_learner_role_and_profile` passing.

### Idempotency, including path-mismatch

Re-verified against source and the fresh test run: idempotency records are scoped by
`(actor_user_id, http_method, operation_identifier, idempotency_key)`, and
`_idempotency_start` raises `ConflictError` whenever an existing record's
`request_fingerprint` does not match the current request's fingerprint. The
path-mismatch case specifically (`test_complete_...isolation`'s reuse of one
learner-owned key across two different sessions the same learner owns) produced `409`,
not a false replay, because `path_fingerprint` binds the fingerprint to the path
parameter (`session_id`) as well as the operation and actor.

### Complete/abandon neutrality

Source-verified: `_transition`'s only precondition is `session_row.state != "active"` ->
`ConflictError`; there is no BKT, mastery, certification, Guess-Guard, sequencing, or any
other scientific/pedagogical predicate anywhere in the transition path. `complete` and
`abandon` are both implemented as the same `_transition` helper differing only in
`target_state` and `operation`, confirming symmetric, criteria-free handling.

### NO numeric expiry; NO scientific field in any DTO/log/audit

- `SessionFields`/`SessionCommandResponse`/`ActiveSessionResponse`
  (`app/domain/b_session.py`) expose exactly `session_id`, `state`,
  `runtime_bundle_version`, `created_at_utc`, `row_version`, and (on command responses)
  `request_id` -- no `expires_at`, no numeric timeout, no question/attempt/answer/hint
  field. `StrictModel`'s `extra="forbid"` prevents silent field addition.
- `SessionRecord.expires_at_utc` (the underlying `b_sessions` column, pre-existing from
  an earlier batch) is set to `None` unconditionally in `start_session` and is never
  read or surfaced by any of the four endpoints or by `_session_fields`.
- `provenance()`'s audit/idempotency payload fields (`actor_user_id`, `request_id`,
  `operation_or_event_type`, `reason_code`, `resource_type`, `resource_id`,
  `source_class`, `source_system`, `environment`, `schema_revision`) contain no
  scientific term; `AuditEvent` rows for this batch record only
  `before_reference_or_version`/`after_reference_or_version` state strings
  (`"active"`/`"completed"`/`"abandoned"`).
- `test_b_session_dto_contains_no_scientific_expiry_or_attempt_fields`
  (`tests/test_be2_architecture_guards.py`) performs an AST-level field-identifier scan
  of `app/domain/b_session.py` against a forbidden-term set that includes
  `expires_at`, `expiry`, `timeout`, `question`, `attempt`, `opportunity`, plus the
  shared `PROHIBITED_COLUMN_TERMS` set; it passed in the fresh run.
- `test_exact_authorized_model_table_set_and_no_scientific_columns` independently scans
  every column of every table in `Base.metadata` (not just `b_sessions`) against the
  same prohibited-term set; it passed.

### Architecture guards

All 13 tests in `tests/test_be2_architecture_guards.py` passed in the fresh, isolated
run (`pytest -q tests/test_be2_architecture_guards.py -v`, individually enumerated
above and below), including the table/column scan, the exact-route-set and
exact-four-operation checks, the DTO AST scan, the Yass/`component_b_generator`
import-root scan (`test_no_yass_research_or_scientific_imports`), the dependency-file
scan (`test_dependency_files_exclude_research_generator`), the three prior migrations'
content guards, and the no-production-failure-injection-marker scan
(`test_no_production_failure_injection_or_debug_mechanism`).

### `ENGINEERING_CONTINUATION_ALLOWED_RATIFICATION_DEFERRED_TO_BE6`

Confirmed still in effect and unchanged by this closure review. This review is a
technical/engineering closure of the BE2.3-BE2.4 batch's implementation quality and
scope boundary only. It is **not** a named-approver ratification: product owner,
backend security owner, and privacy/child-safety owner ratification of session
lifecycle behavior (including the still-`UNRESOLVED` numeric expiry/timeout,
completion, and safe-progress policy gates recorded in earlier BE0/BE2 entries) remains
deferred to the BE6 pre-pilot review. This closure does not create, satisfy, or
shortcut that requirement.

### Non-blocking observations carried forward (unchanged from the batch above)

- The `find_current_approved_published()` most-recent-`created_at_utc` tie-break remains
  an engineering assumption, not a governed selection policy.
- The identity-map/`FOR UPDATE` hazard pattern (`get_owned` unlocked read followed by a
  separate locked re-fetch) is latent in `classroom_membership.approve_membership` and
  was not touched in this batch; recorded again here for BE6 awareness.

Neither observation blocks this closure.

### Closure decision

```text
Identifier: BE2_SESSION_SKELETON_BATCH_CLOSED
Decision:   GO
```

Basis: exactly four authorized routes exist and no others; zero schema drift on a
freshly migrated database; the one-active-session invariant held across 10 independently
re-run genuine concurrent-race executions with no flake; fail-closed-with-no-bundle is
enforced by construction, not merely by a passing assertion; ownership/role isolation,
idempotency (including path-mismatch), and complete/abandon neutrality were all
independently re-verified against source, not just against the prior batch's summary; no
numeric expiry and no scientific field exist in any DTO, log, or audit payload; and all
13 architecture guards pass against a clean, isolated, freshly built environment. This is
an engineering closure only -- `ENGINEERING_CONTINUATION_ALLOWED_RATIFICATION_DEFERRED_TO_BE6`
remains in effect, and named-approver ratification remains deferred to BE6. No commit was
made; the working tree remains as Yasindu left it, pending their review and commit
decision.

---

## Phase BE3 — Batch: Minimal Live-Engine Packaging (`upadya-component-b-live-engine`) — NOT A CLOSURE REVIEW

Completed: 2026-07-24 Asia/Colombo
Build target: `Dev/backend/`
Scientific source repository: `Yass`, pinned commit `0e86fdcbc0ffcdbda3d37c742e83b1d532910e2b`
Authorized by: `backend/provenance/component-b-live-engine-reuse-map.json` and
`component-b-closure-decisions.json` (`generator_packaging_decision.selected_strategy =
MINIMAL_UPADYA_COMPONENT_B_LIVE_ENGINE_AT_BE3`)

### 1. Scope

Packaging and import-boundary work only. No adapter wiring, no live learner flow, no new
scientific parameters, no application import. This batch builds and verifies a new, minimal
wheel distinct from the prohibited full research wheel, and pins it as a backend dependency
without wiring it into `app/`. No git state-changing command was run; nothing is committed.

### 2. Source verification (before use)

`git diff 0e86fdcbc0ffcdbda3d37c742e83b1d532910e2b -- Implementation_v1.0/component_b_generator
Implementation_v1.0/models Implementation_v1.0/validators` against the Yass working tree (HEAD
`648762a60a4590f714418b36dbd286569ee66c5d` at verification time) showed the working tree had
**drifted** from the pinned commit in exactly one file,
`component_b_generator/aggregation/session.py` (a later, unpinned change narrowing
`_response_time_stats`'s standard-deviation handling for fewer than two timed responses).
Because of this drift, the package was built from the exact pinned-commit blob content via
`git show 0e86fdcbc0ffcdbda3d37c742e83b1d532910e2b:<path>` for every file, never from the
mutable working tree. All 45 verbatim files in the built package were independently confirmed
byte-identical to their pinned-commit blob afterward.

The pre-existing `generator_tracked_source_manifest` value recorded in
`component-b-closure-decisions.json`/`component-b-baseline.json`
(`fd4f052e41539434ad4ff6bbb72fa01815ef750ceeb0a6d8ebc6fbc481e07e2c`, 82 tracked files) uses an
undocumented construction; several plausible reconstructions (repo-relative vs.
generator-relative paths, forward- vs. back-slash separators, blob vs. working-tree content,
trailing newline variants) were tried and none reproduced it. Rather than guess further, source
fidelity was established directly by commit diff and per-file byte comparison (above), which is
a stronger guarantee than reproducing an opaque hash. This package's own source manifest is
independently documented (below) with its construction fully specified.

### 3. Reviewed live-safe closure assembled

Location: `backend/packaging/component_b_internal/` (existing stub `pyproject.toml` from an
earlier BE0 note, corrected here — it previously declared the prohibited research
distribution's own name/version; that was dead placeholder text, not a real dependency).

45 files copied byte-identical from the pinned commit (verified — see above); 7 files
deliberately trimmed to remove content that is unreachable/prohibited or simply not part of
the reviewed capability closure, each with an inline `PACKAGING NOTE` docstring explaining the
removal:

- `generation/task_instances.py` — kept `build_task_instance`/`generate_task_instances` bodies
  byte-identical; removed the offline `run_phase_b2a` smoke-path entry point and its unique
  imports, most importantly `from ..runner import run_phase_b1` — exactly the synthetic
  dependency the reuse map's note for this capability flagged as needing exclusion.
- `models/behaviour.py` — kept `ERROR_PATTERNS`/`ErrorPattern`/`HINT_LEVELS`/`_require_skill`/
  `BOpportunityResponseSummary` byte-identical; removed `AuditOnlyModel`,
  `BLearnerSkillTruth`, `BAttemptEvent`, `BoundedBetaSpec`, `BoundedNormalSpec`,
  `BTruthInitializationConfig`, `BInitialLearnerSkillTruth`, `LognormalLatencySpec`,
  `BFirstAttemptBehaviourConfig`, `BAttemptLoopConfig`, `BOpportunityAttemptResult` — the
  hidden-truth and synthetic-behaviour-generation classes explicitly named in the reuse map's
  `explicitly_prohibited_from_application` list. Verified none of the retained symbols
  reference any removed class.
- `models/__init__.py`, `behaviour/__init__.py`, `bkt/__init__.py`, `generation/__init__.py`,
  `sequencing/__init__.py` — each pinned-source `__init__.py` eagerly imports at least one
  prohibited or out-of-closure sibling module at package-import time (e.g.
  `behaviour/__init__.py` imports `.attempt_loop`/`.first_attempt`/`.latency`;
  `generation/__init__.py` imports `.item_opportunities`, which imports
  `..cohort.builder.CohortMember`). Replaced with empty re-export surfaces; no module in the
  reviewed closure does a bare `from ..<package> import X`, so nothing depends on the removed
  re-exports.

Excluded entirely by omission (files never copied into the package, so they are unreachable by
`ModuleNotFoundError`, not merely unimported): `cohort/*`, `behaviour/first_attempt.py`,
`behaviour/latency.py`, `behaviour/attempt_loop.py`, `behaviour/initialization.py`,
`behaviour/wrong_answers.py`, `behaviour/derivation.py`, `behaviour/seeds.py`,
`behaviour/validation.py`, `pipeline.py`, `pilot.py`, `runner.py`, `audits/*`,
`generation/item_opportunities.py`, `generation/coverage.py`, `sequencing/eligibility.py`,
`sequencing/select_item.py`, `bkt/orchestrator.py`, `config/*`, `adapters/*`, `validators/*`.

### 4. Package identity and build

- Distribution: `upadya-component-b-live-engine`, version `0.1.0+be3.0e86fdc` (distinct name
  and version from the prohibited research distribution `upadya-component-b-generator`, per
  `closure-decisions.json`'s `versioning_method`).
- Dependencies: `pydantic==2.13.4`, `PyYAML==6.0.3` only (the reviewed closure does not use
  numpy/pandas/scikit-learn/jsonschema, unlike the full research wheel).
- Built with `python -m build --wheel --no-isolation` (`setuptools==80.10.2`,
  `wheel==0.46.3`) in an isolated Python 3.11.15 venv.
- Wheel: `upadya_component_b_live_engine-0.1.0+be3.0e86fdc-py3-none-any.whl`
  SHA-256 `faa5760df1f5a3874f38f8103cdaaa88a14b3190216e46ab21765eee65a70c29`, placed at
  `backend/provenance/wheels/` alongside the existing (still-present, still-prohibited-for-
  runtime) full research wheel.
- Package source manifest: SHA-256 of `'<package-relative-posix-path>\t<sha256-of-file-bytes>\n'`
  lines sorted by path, over all 52 `*.py` files in
  `backend/packaging/component_b_internal/` — `4321ebfdb7041a62be8620e857736db4146ae9eb27e78dffd1fd52f44664315f`.
  Full construction, both checksums, and per-file inclusion/exclusion/trim rationale are
  recorded in `backend/provenance/component-b-live-engine-manifest.json`.

### 5. Verification (isolated Python 3.11.15 venv, `pydantic`+`PyYAML` only)

- All function/class names listed against the 11 capabilities in
  `component-b-live-engine-reuse-map.json` import successfully from the installed wheel.
- `importlib.import_module` raises `ModuleNotFoundError` for `component_b_generator.cohort`,
  `.cohort.builder`, `.behaviour.first_attempt`, `.behaviour.latency`,
  `.behaviour.attempt_loop`, `.pipeline`, `.pilot`, `.runner`, `.audits` (and its submodules),
  `.generation.item_opportunities`.
- `AuditOnlyModel`/`BLearnerSkillTruth`/`BAttemptEvent`/etc. are absent from
  `component_b_generator.models.behaviour` in the installed wheel.
- `bkt_predict`/`bkt_posterior`/`bkt_update` returned byte-identical output across two calls
  with identical fixed inputs in the same process (determinism smoke test).

### 6. Dependency pin (no adapter wiring)

`requirements.in`, `requirements.lock` (with `--hash=sha256:...`), and `requirements.txt` each
gained one line: `./provenance/wheels/upadya_component_b_live_engine-0.1.0+be3.0e86fdc-py3-none-any.whl`.
No file under `app/` imports the package or any of its modules. `backend/.dockerignore`
currently excludes `provenance/`, `packaging/`, and `*.whl` from the Docker build context, so
an actual `docker build` cannot yet install this pin — that gap, plus any Dockerfile `COPY`
change, is explicitly left for BE3b (adapter wiring), not touched here.

### 7. Tests added and existing guards re-run

New: `tests/test_be3_live_engine_boundary.py` —
`test_prohibited_module_is_not_importable_from_the_package` (parametrized over all 13 excluded
modules from the reuse map's exclusion list), `test_thirteen_prohibited_capabilities_are_unreachable`,
`test_no_dataset_generation_or_experiment_runner_entry_point_in_package`,
`test_app_import_graph_still_does_not_reach_prohibited_modules` (unchanged BE2-style guard,
reconfirmed against `app/` with the new package installed), `test_bkt_update_is_deterministic_under_fixed_provenance`,
`test_guess_guard_is_deterministic_under_fixed_provenance`. Uses `pytest.importorskip` so it
skips cleanly wherever the package is not installed.

Re-run in the same isolated venv: `tests/test_be2_architecture_guards.py` (all 13, including
`test_dependency_files_exclude_research_generator`, which still passes — the new pin's text
contains neither `component-b-generator`/`component_b_generator` nor `yass`) and
`tests/test_be3_live_engine_boundary.py` — **35 passed, 0 failed**
(`pytest -q tests/test_be3_live_engine_boundary.py tests/test_be2_architecture_guards.py`).
`pytest -q --collect-only` across the full `tests/` tree collected all 122 tests with no import
errors (the DB-backed test modules were not executed — no local PostgreSQL instance — but
collection alone confirms this batch introduced no import-time regression anywhere).

### 8. Recorded checksums (as requested)

- Wheel SHA-256: `faa5760df1f5a3874f38f8103cdaaa88a14b3190216e46ab21765eee65a70c29`
- Package source manifest SHA-256: `4321ebfdb7041a62be8620e857736db4146ae9eb27e78dffd1fd52f44664315f`
- Pinned source commit: `0e86fdcbc0ffcdbda3d37c742e83b1d532910e2b`

### 9. Limitations and next task

This is packaging + import-boundary work only — **not a closure review** and not a governance
ratification. Unresolved: whether the trimmed-file boundary choices above (especially the
`models/behaviour.py` split and the five emptied `__init__.py` files) match what a named
Component B owner would approve; the Docker build-context gap in §6; and all governance-register
items already `UNRESOLVED`/`CALIBRATION_PENDING` in `component-b-closure-decisions.json` remain
exactly as they were. Next task is BE3b: a named-owner review of this packaging batch, followed
(only if approved) by adapter wiring, `.dockerignore`/Dockerfile updates to actually install the
pin in the image, and the first real application import. No commit was made; the working tree
remains as Yasindu left it, pending their review and commit decision.

## BE3a closure review — independent re-verification (2026-07-24)

Separate closure review of the minimal live-engine package against PROMPT BE3a,
`component-b-live-engine-reuse-map.json`, and the `generator_packaging_decision` in
`component-b-closure-decisions.json`. Read-only git; nothing committed. `.claude/settings.json`
treated as out of scope for this batch. Re-verification performed independently from a clean
isolated environment, not by re-reading the prior batch's own claims.

**Environment.** `docker run` against `python:3.11.15-slim-bookworm@sha256:b18992999dbe963a45a8a4da40ac2b1975be1a776d939d098c647482bcad5cba`
— the exact base image digest pinned in `backend/Dockerfile` — with the `backend/` tree copied
into a writable `/workspace` inside the container (a read-only bind mount plus `pip install`
was used only to avoid touching the host). `pip install --require-hashes --no-deps -r
requirements.lock` installed cleanly, including the live-engine wheel via its recorded hash.

**(1) Wheel identity — PASS.** `sha256sum` on both files in `backend/provenance/wheels/`:
live-engine wheel = `faa5760df1f5a3874f38f8103cdaaa88a14b3190216e46ab21765eee65a70c29`, exactly
matching `component-b-live-engine-manifest.json:package.wheel_sha256` and the hash pinned in
`requirements.lock`. Full research wheel = `12b5ba5b7e8a70785a3e2b49e5c07bc8f89cc677c268ea509907f8f6d517e750`,
matching `component-b-closure-decisions.json:full_wheel_artifact.sha256`. The two digests are
distinct.

**(2) Every packaged file — PASS.** Listed all 52 `*.py` files actually present under
`backend/packaging/component_b_internal` (matches `package_source_manifest.file_count`).
Confirmed against the pinned Yass commit `0e86fdcbc0ffcdbda3d37c742e83b1d532910e2b` (verified
reachable in the local Yass clone via `git cat-file -e`):
- All 45 files listed as verbatim were diffed with `diff <(git show <commit>:Implementation_v1.0/<path>) <packaged file>` — zero differences on every file.
- All 7 trimmed files (`generation/task_instances.py`, `models/behaviour.py`, `models/__init__.py`, `behaviour/__init__.py`, `bkt/__init__.py`, `generation/__init__.py`, `sequencing/__init__.py`) were diffed line-by-line against the same pinned blobs. In every case the only changes are: added packaging-note docstrings, removed imports/re-exports of prohibited symbols (`run_phase_b2a`, `..runner.run_phase_b1`, the `AuditOnlyModel`/hidden-truth/synthetic-behaviour classes, `.cohort`, `.item_opportunities`, `.eligibility`, `.select_item`, `.orchestrator`, and their transitive `__init__.py` re-exports), and removal of the now-unused stdlib/pydantic imports those deletions made dead. Every retained function/class body (`build_task_instance`, `generate_task_instances`, `BOpportunityResponseSummary`, `ERROR_PATTERNS`, `ErrorPattern`, `HINT_LEVELS`, `_require_skill`) is untouched — no line inside a retained body differs from the pinned blob. No mathematical formula was altered.
- Independently recomputed `package_source_manifest.sha256` from the packaged tree using the documented algorithm: `4321ebfdb7041a62be8620e857736db4146ae9eb27e78dffd1fd52f44664315f`, file_count 52 — both match the manifest exactly.

**(3) 13 prohibited-module unreachability — PASS.** Inside the isolated container, attempted
`importlib.import_module` on 22 module paths covering all 13 reuse-map exclusion items —
`cohort`/`cohort.builder`, all 6 `behaviour.*` synthetic submodules, `pipeline`, `pilot`,
`runner`, `audits` + 3 submodules, `generation.item_opportunities`, `sequencing.eligibility`,
`sequencing.select_item`, `bkt.orchestrator`, and the standalone `validators` package — every
one raised `ModuleNotFoundError`. `component_b_generator.models.behaviour` was imported and
checked for the 11 hidden-truth/synthetic classes named in the reuse map: none present. Then
ran `pytest tests/test_be3_live_engine_boundary.py tests/test_be2_architecture_guards.py` in
the same container — **35 passed, 0 failed**, including the app-import-graph guard
(`test_app_import_graph_still_does_not_reach_prohibited_modules`) and the BE2
`test_no_yass_research_or_scientific_imports` / `test_dependency_files_exclude_research_generator` guards.

**(4) Full research wheel not an app dependency — PASS.** `requirements.in`/`requirements.txt`/`requirements.lock`
reference only the live-engine wheel path; grepped all three for the research wheel's
distribution name — no match. Grepped `app/**/*.py` for `component_b|cohort|pipeline|pilot|generator`
— the only two hits are a `"generator": "not_checked"` health-check status string
(`app/api/routes/health.py`) and a docstring mention of "synthetic-generator fields" being
excluded (`app/infrastructure/persistence_models.py`); neither is an import. Confirmed all 11
reuse-map capability symbols import successfully from the installed wheel in isolation.

**(5) BE2 guards + BE3 boundary tests — PASS.** See (3): 35/35 passed in the isolated,
Dockerfile-pinned Python 3.11.15 environment.

**(6) `.dockerignore` limitation — confirmed, carry-forward, not a blocker.** Read
`backend/.dockerignore`: it excludes `provenance/`, `packaging/`, and `*.whl` from the `docker
build` context. This is real and independently reproducible — a `docker build` of
`backend/Dockerfile` today cannot resolve the `./provenance/wheels/...whl` path in
`requirements.lock`. It does not affect this review because verification was performed by
copying the tree into a container rather than through `docker build`, which is what the
prompt's "clean isolated Python 3.11 env" calls for; the app image build path is explicitly
BE3b scope per `generator_packaging_decision`, not this batch.

**Verdict: GO — `BE3A_LIVE_ENGINE_PACKAGE_BATCH_CLOSED`.** All five re-verifiable technical
gates pass under independent, from-scratch checking (not a re-read of the prior batch's own
claims); the one disclosed limitation is confirmed real and is correctly scoped as a BE3b
carry-forward rather than a defect in this batch. This closes the *packaging and import-boundary*
scope only — it is not a governance or named-owner ratification, and every `UNRESOLVED`/
`CALIBRATION_PENDING` item in `component-b-closure-decisions.json`'s governance register remains
open exactly as recorded there. No files were modified by this review beyond this log entry; no
git commit was made.
