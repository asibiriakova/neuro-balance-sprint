"""FastAPI app implementing `openapi.yaml`.

Run it with `uv run uvicorn app.main:app --reload` from `backend/`. All
spec-defined routes are mounted under `/api` (matching the spec's
`servers: [{url: /api}]`), plus `/api/auth/register` and `/api/auth/login`
which the spec doesn't define but which every bearer-protected endpoint
needs in order for a client to obtain a token.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.frontend import create_frontend_server
from app.routers import auth, planning, sprint
from app.store import create_store

# `None` outside the Docker image (see app/frontend.py) - every route below
# still works, there's just nothing to proxy non-`/api` requests to.
_frontend_server = create_frontend_server()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if _frontend_server is not None:
        _frontend_server.start()
    try:
        yield
    finally:
        if _frontend_server is not None:
            _frontend_server.stop()


app = FastAPI(
    title="NeuroSprint API",
    version="1.0.0",
    description="Backend implementation of the contract in openapi.yaml.",
    lifespan=lifespan,
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

# A single database-backed store for the whole app, pointed at
# `NEUROSPRINT_DATABASE_URL` (SQLite file by default - see app/db.py).
# Tests replace this with a fresh in-memory-SQLite instance per test (see
# tests/conftest.py) so cases don't leak state into each other.
app.state.store = create_store()

app.include_router(auth.router)
app.include_router(sprint.router)
app.include_router(planning.router)


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


# Catches everything the routes above don't (i.e. everything outside
# `/api`) and hands it to the frontend - see app/frontend.py. Registered
# last so it never shadows a real route, and only when there's an actual
# frontend build to serve.
if _frontend_server is not None:

    @app.api_route(
        "/{_full_path:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
        include_in_schema=False,
    )
    async def _serve_frontend(request: Request, _full_path: str) -> Response:
        assert _frontend_server is not None  # narrowed at module scope above
        return await _frontend_server.proxy(request)
