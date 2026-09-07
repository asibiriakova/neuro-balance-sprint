"""FastAPI app implementing `openapi.yaml`.

Run it with `uv run uvicorn app.main:app --reload` from `backend/`. All
spec-defined routes are mounted under `/api` (matching the spec's
`servers: [{url: /api}]`), plus `/api/auth/register` and `/api/auth/login`
which the spec doesn't define but which every bearer-protected endpoint
needs in order for a client to obtain a token.
"""

from __future__ import annotations

from fastapi import FastAPI

from app.routers import auth, planning, sprint
from app.store import create_store

app = FastAPI(
    title="NeuroSprint API",
    version="1.0.0",
    description="Backend implementation of the contract in openapi.yaml.",
)

# A single process-local, in-memory store for the whole app. Tests replace
# this with a fresh instance per test (see tests/conftest.py) so cases
# don't leak state into each other.
app.state.store = create_store()

app.include_router(auth.router)
app.include_router(sprint.router)
app.include_router(planning.router)


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
