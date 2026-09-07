# NeuroSprint backend

FastAPI implementation of the contract in [`../openapi.yaml`](../openapi.yaml),
backed by an in-memory store (no database yet - see `_docs/plan.md` for the
intended Postgres phase).

## Run it

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

Interactive docs at `http://localhost:8000/docs`.

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

```
app/
  main.py       FastAPI app, mounts the routers under /api
  models.py     Pydantic schemas mirroring openapi.yaml's components
  store.py      In-memory store + demo seed data
  auth.py       Password hashing, bearer-token dependency
  routers/
    auth.py     /api/auth/register, /api/auth/login
    sprint.py   /api/sprints/current*
    planning.py /api/planning/assistant
tests/          pytest suite (uses FastAPI's TestClient, one fresh store per test)
```

## Test

```bash
cd backend
uv run pytest
```
