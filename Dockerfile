# syntax=docker/dockerfile:1

# --- frontend build -----------------------------------------------------
# The frontend is a TanStack Start app: its normal `bun run build` targets
# a Cloudflare Workers runtime and renders HTML per-request, so there's no
# static index.html to serve. NITRO_PRESET=node-server (see
# frontend/vite.config.ts) makes it build a small standalone Node HTTP
# server instead - one the backend stage below can run directly. The app
# has no server functions or route loaders (every page calls the FastAPI
# backend client-side, see frontend/src/services/), so it doesn't lose
# anything by not running on an edge/SSR runtime.
FROM oven/bun:1 AS frontend-build
WORKDIR /app/frontend

COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ ./
ENV NITRO_PRESET=node-server
RUN bun run build

# --- backend + runtime image ---------------------------------------------
FROM python:3.13-slim AS backend
WORKDIR /app/backend

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
# `bun` runs the built frontend server (see app/frontend.py) - no separate
# Node install needed.
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

# Install dependencies before copying app code so this layer is cached
# across code-only changes.
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

COPY backend/ ./
RUN uv sync --locked --no-dev

# Frontend server (from frontend-build): `server/` and `public/` must stay
# siblings, as they are in `.output/` - the server serves `public/`'s
# assets itself. See app/frontend.py for how the backend finds this.
COPY --from=frontend-build /app/frontend/.output/server /app/frontend/server
COPY --from=frontend-build /app/frontend/.output/public /app/frontend/public
ENV NEUROSPRINT_FRONTEND_DIR=/app/frontend

# SQLite by default (see app/db.py); mount a volume at this path, or set
# NEUROSPRINT_DATABASE_URL to point elsewhere (e.g. Postgres), to persist
# data across container restarts.
ENV NEUROSPRINT_DATABASE_URL=sqlite:////data/neurosprint.db
VOLUME ["/data"]

EXPOSE 8000
CMD ["uv", "run", "--no-dev", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
