# Adaptive Math Platform

A personalized mathematics learning platform for young learners. It adapts task difficulty to a
learner's demonstrated mastery (via Bayesian Knowledge Tracing) and delivers questions, hints, and
adaptive game-based activities through a FastAPI backend and an Expo/React Native frontend.

> **Literature-informed synthetic data — not clinical evidence.** This is a research prototype
> (R26-IT-138). It is not a diagnostic tool, not clinically validated, and not intended for use by
> a real child in its current state.

## Architecture

| | |
|---|---|
| **Backend** | `backend/` — FastAPI + PostgreSQL, Python 3.11 |
| **Frontend** | `frontend/` — Expo (React Native), TypeScript |

The platform has two learning components:

- **Component B** — mastery-based item sequencing with hints, attempts, and BKT-driven skill
  tracking.
- **Component C** — an adaptive game engine: thirty task templates across eight game families,
  with a rule-based difficulty policy and a safety controller. Selection is entirely
  backend-driven; the frontend never chooses a game family.

## First run — do these in order

A fresh clone is **not** a running system. Follow these six steps in sequence; step 4 is the one
most easily missed, and skipping it makes Component C fail on every attempt with no useful error.

| # | Step | Skipping it causes |
|---|---|---|
| 1 | Create a Supabase project (authentication) | Nobody can sign in at all |
| 2 | Choose a database and set `DATABASE_URL` | Backend will not start |
| 3 | Run migrations (`alembic upgrade head`) | Every request fails — no tables exist |
| 4 | **Register the Component C runtime bundle** | **Component C returns HTTP 409 on every session** |
| 5 | Provision a learner and classroom | Sign-in works, but the app is stuck in onboarding |
| 6 | Start the frontend | Nothing to use |

### 1. Supabase project (required — authentication)

Authentication is **not optional and has no local substitute.** Create a free project at
`https://supabase.com`, then from **Project Settings → API** copy these into `backend/.env`:

```
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_JWT_ISSUER=https://YOUR-PROJECT-REF.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_JWKS_URL=https://YOUR-PROJECT-REF.supabase.co/auth/v1/.well-known/jwks.json
```

and these into `frontend/.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

The backend verifies token signatures against the JWKS endpoint. It never calls a Supabase data
API — see step 2, which is a separate decision.

### 2. Choose a database

Supabase is itself PostgreSQL, so this is a choice of **who hosts it**, not of database engine.
Both options use the same schema, migrations and code.

**Option A — Supabase Postgres (recommended for handover).** No Docker required. From
**Project Settings → Database**, copy the connection string into `backend/.env` as `DATABASE_URL`.
Paste it verbatim — `sslmode` and connection-pooler handling are dealt with in
`app/infrastructure/database.py`, so nothing needs editing out of it.

- Use the **direct connection** (port `5432`) if it resolves.
- Use the **transaction pooler** (port `6543`) if it does not — Supabase's direct hostname is
  IPv6-only on projects without the IPv4 add-on.

Note that Supabase pauses free projects after roughly a week of inactivity; an app that
"stopped working" after a quiet period usually just needs the project resumed from the dashboard.

**Option B — local Postgres in Docker.** Self-contained and offline, but every machine needs steps
3–5 run again from scratch. Keep the `DATABASE_URL` that `.env.example` ships with.

### 3–5. Initialise the database

**These steps are required exactly once per database.** With Option A, whoever performs the
handover can run them ahead of time so the recipient inherits a working system.

```bash
cd backend
cp .env.example .env          # then edit in the values from steps 1 and 2

# 3 — create the schema
alembic upgrade head

# 4 — REQUIRED. Register the Component C runtime bundle.
#     Migrations create the table; only this creates the row Component C needs.
python -m scripts.register_c_runtime_bundle

# 5 — create a teacher, a classroom, and a join code
python scripts/dev_fixture_learner.py --test-fixture-only --mint-invite-only --api-base http://localhost:8000
```

Step 4 is idempotent — running it twice will not create a second row. Run it as
`python -m scripts.register_c_runtime_bundle`, **never** `python scripts/register_c_runtime_bundle.py`;
the latter breaks provenance resolution.

Under Docker, prefix steps 3 and 4 with `docker compose run --rm api `.

---

## Getting started

### Backend

**Dependencies:** `backend/requirements.lock` is the real, current, hash-verified dependency set —
it's what the Docker image actually installs. **`backend/requirements.txt` is stale and must not
be used**: it pins an older build of the Component B engine wheel, is missing the Component C
engine wheel entirely, and is missing `alembic`, `asyncpg`, `sqlalchemy`, and `pyjwt` outright — a
setup from it cannot connect to the database or run migrations. `backend/requirements.in` is the
human-edited source `requirements.lock` is compiled from.

#### With Docker (recommended)

```bash
cd backend
docker compose build api
docker compose up -d
```

The API listens on the port set by `API_PORT` in `backend/.env` (see `backend/.env.example` for
the full set of required variables — database credentials, Supabase JWT settings).

Run the test suite against the isolated test database (never the dev database — see
`buildLog2.md` for why this matters):

```bash
docker compose run --rm --no-deps api-test python -m pytest -q
```

#### Without Docker

Requires **Python 3.11** (the image pins `3.11.15`) and a locally running PostgreSQL instance.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
python -m pip install --require-hashes --no-deps -r requirements.lock

cp .env.example .env
# Edit .env: point DATABASE_URL at your local Postgres (the .env.example value uses the
# Docker Compose service name `db` as the host, which only resolves inside that network —
# use `localhost` or your actual Postgres host instead), and fill in the Supabase values.

alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Run the test suite the same way, against a real Postgres your own `DATABASE_URL` points at (there
is no `api-test` container to isolate it for you outside Docker, so point it at a database you're
willing to see wiped — see `buildLog2.md`):

```bash
python -m pytest -q
```

#### Dev-only: provisioning a learner without a teacher UI

There is currently no in-app way to do the teacher half of learner onboarding.
`dev_fixture_learner.py` drives the real API to provision one. Run these from `backend/` on the
**host**, not inside a container (it reads `frontend/.env.local`, which only exists on the host
filesystem layout) — `http://localhost:8200` below is whatever `API_PORT` your backend is actually
listening on:

```bash
# Mint a fresh classroom join code for a separate real account to enter in the app's own
# join-code screen:
python scripts/dev_fixture_learner.py --test-fixture-only --mint-invite-only --api-base http://localhost:8200

# Approve that account's pending membership request once they've entered the code:
python scripts/dev_fixture_learner.py --test-fixture-only --approve-pending --api-base http://localhost:8200
```

See `backend/scripts/README.md` for the full flag reference and fixture credentials.

### Frontend

**Dependencies:** `frontend/package.json` lists everything — 31 runtime dependencies, 5 dev
dependencies, no local/relative paths, so `npm install` alone is a complete setup. Pinned to
**Expo SDK ~54.0.35**; if you're setting this up fresh, use a Node version current Expo SDK 54
supports (Node 18 LTS or newer) and check `https://docs.expo.dev/versions/v54.0.0/` for anything
platform-specific before making frontend changes (`frontend/AGENTS.md` carries this same pointer
for AI tooling).

```bash
cd frontend
npm install
npm start
```

Then press `w` for web, or scan the QR code with Expo Go for a device. Configure
`EXPO_PUBLIC_API_BASE_URL` and the Supabase variables in `frontend/.env.local` (see
`frontend/.env.example`).

Type-check and run the contract test suite before committing any change:

```bash
npx tsc --noEmit
npm run test:contract
```

## Running the tests safely

**Never run the test suite against a database holding data you care about.** Six
migration-reversibility tests downgrade and re-upgrade the schema, which drops and recreates
**every table, empty** — including `app_users`, all classroom tables, and the Component C runtime
bundle row from first-run step 4. This is not hypothetical: it destroyed a real onboarding
account's classroom membership on 2026-08-27, and the symptom looked like a login bug rather than
data loss.

Under Docker this is already handled — `api-test` points at a separate `upadya_test` database:

```bash
docker compose run --rm --no-deps api-test python -m pytest -q
```

Outside Docker, or against a hosted database, **you must point `DATABASE_URL` at a throwaway
database first.** On Supabase that means a **second project**, never the one holding your data.

After any full test run against a database you then intend to use, re-run first-run step 4
(`python -m scripts.register_c_runtime_bundle`) — the bundle row will have been erased.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **Component C fails every time; HTTP 409 on session creation** | The `c_runtime_bundle_records` row is missing — first-run step 4 was never run, or a test run erased it. The error deliberately reveals nothing about which gate failed | `python -m scripts.register_c_runtime_bundle` |
| `connect() got an unexpected keyword argument 'sslmode'` | An older build, or a hand-edited connection string. `sslmode` is libpq syntax that asyncpg rejects | Paste the provider's string unmodified; `app/infrastructure/database.py` strips it |
| Database host will not resolve (Supabase) | The direct hostname is IPv6-only without the IPv4 add-on | Use the transaction pooler on port `6543` |
| `prepared statement "__asyncpg_stmt_x__" does not exist` | A transaction-mode pooler is multiplexing connections | Confirm the URL uses port `6543` or a `pooler.` hostname so the statement caches are disabled automatically |
| Everything worked, now nothing connects (Supabase) | Free projects pause after about a week of inactivity | Resume the project from the Supabase dashboard |
| The app opens but is stuck asking for a classroom code | First-run step 5 was not completed, or the membership is still pending | Mint a code, then approve the request — see the dev-fixture commands below |
| Backend changes appear to have no effect | Nothing is bind-mounted, and a running container keeps its old image | `docker compose build api` then `docker compose up -d --force-recreate api` |
| A learner surface shows "This one isn't ready" | Expected for three deliberately held templates (`C-SF-02`, `C-TC-02`, `C-CC-04`) — the safety design working, not a defect | No action; see `backend/buildLog2.md` |

## Project history uu

`backend/buildLog1.md` and `backend/buildLog2.md` are the durable, append-only build record for
this project — every batch of work, every finding, every owner ruling is recorded there in the
order it happened. They are the authoritative history; prefer them over any other document if
something appears to disagree.

## License

MIT — see [LICENSE](LICENSE).
