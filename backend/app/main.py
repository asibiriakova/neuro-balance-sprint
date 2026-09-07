"""FastAPI app implementing `openapi.yaml`.

Run it with `uv run uvicorn app.main:app --reload` from `backend/`. All
spec-defined routes are mounted under `/api` (matching the spec's
`servers: [{url: /api}]`), plus `/api/auth/register` and `/api/auth/login`
which the spec doesn't define but which every bearer-protected endpoint
needs in order for a client to obtain a token.
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, planning, sprint
from app.store import create_store

app = FastAPI(
    title="NeuroSprint API",
    version="1.0.0",
    description="Backend implementation of the contract in openapi.yaml.",
)

# The frontend (Vite dev server) runs on its own origin, so the browser
# needs explicit CORS headers to call this API. `NEUROSPRINT_CORS_ORIGINS`
# lets a real deployment lock this down to its actual frontend origin(s)
# (comma-separated); it defaults to "*" for local development, which is
# safe here since every route requires a bearer token rather than cookies
# (`allow_credentials=False`).
_cors_origins = os.environ.get("NEUROSPRINT_CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _cors_origins == "*" else [o.strip() for o in _cors_origins.split(",") if o.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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
