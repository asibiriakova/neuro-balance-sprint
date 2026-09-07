"""SQLAlchemy engine/session wiring.

Database-agnostic on purpose: `NEUROSPRINT_DATABASE_URL` can be any
SQLAlchemy connection URL (see
https://docs.sqlalchemy.org/en/20/core/engines.html#database-urls).
Defaults to a local SQLite file so `uv run uvicorn app.main:app` works
with zero setup. Pointing it at e.g. `postgresql+psycopg://...` (once the
`psycopg` driver is added as a dependency) is the entire migration to
Postgres - nothing in `app/db_models.py` or `app/store.py` is
SQLite-specific.
"""

from __future__ import annotations

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

DEFAULT_DATABASE_URL = "sqlite:///./neurosprint.db"


class Base(DeclarativeBase):
    """Shared declarative base for every table in `app.db_models`."""


def make_engine(database_url: str) -> Engine:
    """Build an engine for `database_url`.

    The two `connect_args`/`poolclass` tweaks below are SQLite-only and
    exist purely because SQLite ties a connection to the thread that
    opened it, while FastAPI's `TestClient` and uvicorn's request handling
    call in from a worker thread pool. Every other dialect (Postgres
    included) ignores them - just pass its URL.
    """
    connect_args: dict[str, object] = {}
    engine_kwargs: dict[str, object] = {}
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        if ":memory:" in database_url:
            # A bare in-memory SQLite DB lives only on the connection that
            # created it. StaticPool keeps every checkout on that same
            # connection so the data survives across requests instead of
            # vanishing (and re-seeding would race) after the first one.
            engine_kwargs["poolclass"] = StaticPool
    return create_engine(database_url, connect_args=connect_args, **engine_kwargs)


def make_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def init_db(engine: Engine) -> None:
    """Create every table declared in `app.db_models`. Idempotent - a
    no-op for tables that already exist.
    """
    import app.db_models  # noqa: F401  registers the models on Base.metadata

    Base.metadata.create_all(bind=engine)
