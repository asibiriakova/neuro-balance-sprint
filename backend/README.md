# NeuroSprint backend

FastAPI implementation of the contract in [`../openapi.yaml`](../openapi.yaml),
backed by a SQLAlchemy-managed database (SQLite by default; see `_docs/plan.md`
for the intended Postgres phase).

## Run it

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

Interactive docs at `http://localhost:8000/docs`.

## Database

Configured entirely through one environment variable:

- `NEUROSPRINT_DATABASE_URL` - any [SQLAlchemy database URL](https://docs.sqlalchemy.org/en/20/core/engines.html#database-urls).
  Defaults to a local SQLite file, `sqlite:///./neurosprint.db`, created
  (with all tables) on first run.

Nothing in `app/store.py` or `app/db_models.py` is SQLite-specific, so
pointing this at Postgres later (`postgresql+psycopg://...`, once the
`psycopg` driver is added as a dependency) is the entire migration - no
code changes needed. Tests never touch the configured database; they run
each test against its own `sqlite:///:memory:` instance (see
`tests/conftest.py`).

## Auth

`openapi.yaml` assumes every request already carries a bearer token, so it
doesn't define how to get one. This backend adds two endpoints for that,
outside the spec:

- `POST /api/auth/register` - `{email, password}` -> `{access_token, token_type}`
- `POST /api/auth/login` - `{email, password}` -> `{access_token, token_type}`

Passwords are hashed with PBKDF2-HMAC-SHA256 and a random per-user salt
(stdlib `hashlib`, no extra dependency). Tokens are opaque random strings
(`secrets.token_urlsafe`), not JWTs, held in the store's token table and
sent as `Authorization: Bearer <token>`.

A demo user is seeded on startup and already owns a sprint:

- email: `demo@neurosprint.app`
- password: `sprint-demo-pw`

A newly registered user has no sprint yet, so `GET /sprints/current` (and
every other sprint endpoint) returns `404` for them, matching the spec.

## Layout

```text
app/
  main.py       FastAPI app, mounts the routers under /api
  models.py     Pydantic schemas mirroring openapi.yaml's components
  db.py         SQLAlchemy engine/session setup (reads NEUROSPRINT_DATABASE_URL)
  db_models.py  SQLAlchemy ORM tables (users, tokens, sprints, tasks, day_logs, archived_sprints)
  store.py      Store built on the ORM tables + demo seed data
  auth.py       Password hashing, bearer-token dependency
  routers/
    auth.py     /api/auth/register, /api/auth/login
    sprint.py   /api/sprints/current*
    planning.py /api/planning/assistant
tests/          pytest suite (uses FastAPI's TestClient, one fresh in-memory-SQLite store per test)
```

## Test

```bash
cd backend
uv run pytest
```
