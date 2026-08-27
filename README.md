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

## Project history

`backend/buildLog1.md` and `backend/buildLog2.md` are the durable, append-only build record for
this project — every batch of work, every finding, every owner ruling is recorded there in the
order it happened. They are the authoritative history; prefer them over any other document if
something appears to disagree.

## License

MIT — see [LICENSE](LICENSE).
