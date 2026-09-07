"""Database-backed persistence.

Holds users, issued bearer tokens, and each user's sprint - the same
shapes the earlier in-memory version held, now durable across restarts
and stored via SQLAlchemy so the underlying database is a config choice
rather than a code choice (see `app/db.py`: `NEUROSPRINT_DATABASE_URL`,
SQLite by default). `create_store()` seeds a demo user and sprint so the
API (and the frontend behind it) has something to show without any setup
step.
"""

from __future__ import annotations

import os
import secrets
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.auth import hash_password
from app.db import DEFAULT_DATABASE_URL, init_db, make_engine, make_session_factory
from app.db_models import ArchivedSprintRow, DayLogRow, SprintRow, TaskRow, TokenRow, UserRow
from app.models import ArchivedSprint, DayLog, PillarId, SprintData, StateId, Task

DEMO_EMAIL = "demo@neurosprint.app"
DEMO_PASSWORD = "sprint-demo-pw"


@dataclass
class UserRecord:
    id: str
    email: str
    hashed_password: str


def _to_user_record(row: UserRow) -> UserRecord:
    return UserRecord(id=row.id, email=row.email, hashed_password=row.hashed_password)


def _to_sprint_data(row: SprintRow) -> SprintData:
    return SprintData(
        sprintNumber=row.sprint_number,
        day=row.day,
        tasks=[
            Task(id=t.id, title=t.title, hours=t.hours, pillar=PillarId(t.pillar), done=t.done) for t in row.tasks
        ],
        logs=[
            DayLog(day=log.day, state=StateId(log.state) if log.state else None, priorities=list(log.priorities), gratitude=log.gratitude)
            for log in row.logs
        ],
        priorities=list(row.priorities),
        gratitude=row.gratitude,
        committed=row.committed,
        archive=[
            ArchivedSprint(
                id=a.id, name=a.name, range=a.range, dominant=StateId(a.dominant), completion=a.completion, insight=a.insight
            )
            for a in row.archive
        ],
    )


class Store:
    """Thin SQLAlchemy wrapper exposing the operations the routers need.

    Each method opens and closes its own short-lived session and returns
    plain dataclasses/Pydantic models (never ORM instances), so callers
    never touch a session or risk using an object after it's detached.
    """

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    # -- users ----------------------------------------------------------

    def create_user(self, email: str, password: str) -> UserRecord:
        with self._session_factory() as session:
            if session.scalar(select(UserRow).where(UserRow.email == email)) is not None:
                raise ValueError(f"email already registered: {email}")
            row = UserRow(id=str(uuid.uuid4()), email=email, hashed_password=hash_password(password))
            session.add(row)
            session.commit()
            return _to_user_record(row)

    def get_user_by_email(self, email: str) -> UserRecord | None:
        with self._session_factory() as session:
            row = session.scalar(select(UserRow).where(UserRow.email == email))
            return _to_user_record(row) if row is not None else None

    def get_user_by_id(self, user_id: str) -> UserRecord | None:
        with self._session_factory() as session:
            row = session.get(UserRow, user_id)
            return _to_user_record(row) if row is not None else None

    # -- tokens -----------------------------------------------------------

    def issue_token(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        with self._session_factory() as session:
            session.add(TokenRow(token=token, user_id=user_id))
            session.commit()
        return token

    def user_id_for_token(self, token: str) -> str | None:
        with self._session_factory() as session:
            row = session.get(TokenRow, token)
            return row.user_id if row is not None else None

    # -- sprints ------------------------------------------------------------

    def get_sprint(self, user_id: str) -> SprintData | None:
        with self._session_factory() as session:
            row = session.get(SprintRow, user_id)
            return _to_sprint_data(row) if row is not None else None

    def save_sprint(self, user_id: str, sprint: SprintData) -> SprintData:
        with self._session_factory() as session:
            row = session.get(SprintRow, user_id)
            if row is None:
                row = SprintRow(user_id=user_id)
                session.add(row)

            row.sprint_number = sprint.sprintNumber
            row.day = sprint.day
            row.priorities = list(sprint.priorities)
            row.gratitude = sprint.gratitude
            row.committed = sprint.committed
            # Replacing each collection wholesale (rather than diffing) is
            # simple and cheap at this scale (tens of rows); cascade
            # "all, delete-orphan" turns it into a delete-then-insert. The
            # explicit flush after clearing forces the deletes to run
            # before the inserts below - without it, a row reusing the
            # same primary key or unique (sprint_id, day) pair as one
            # being replaced can violate that constraint mid-flush.
            row.tasks = []
            row.logs = []
            row.archive = []
            session.flush()
            row.tasks = [
                TaskRow(id=t.id, position=i, title=t.title, hours=t.hours, pillar=t.pillar.value, done=t.done)
                for i, t in enumerate(sprint.tasks)
            ]
            row.logs = [
                DayLogRow(
                    day=log.day,
                    state=log.state.value if log.state else None,
                    priorities=list(log.priorities),
                    gratitude=log.gratitude,
                )
                for log in sprint.logs
            ]
            row.archive = [
                ArchivedSprintRow(
                    id=a.id,
                    position=i,
                    name=a.name,
                    range=a.range,
                    dominant=a.dominant.value,
                    completion=a.completion,
                    insight=a.insight,
                )
                for i, a in enumerate(sprint.archive)
            ]
            session.commit()
            session.refresh(row)
            return _to_sprint_data(row)


def _seed_task(title: str, hours: float, pillar: PillarId, done: bool) -> Task:
    return Task(id=str(uuid.uuid4()), title=title, hours=hours, pillar=pillar, done=done)


def _seed_sprint_data() -> SprintData:
    """Mirrors `seedData()` in the frontend's `MockSprintService` so the
    real backend shows the same shape of demo content the app already
    designs around.
    """
    tasks = [
        _seed_task("Sleep window 23:00-07:00", 3, PillarId.foundation, True),
        _seed_task("Zone-2 cardio x3", 3, PillarId.foundation, False),
        _seed_task("Mobility + breathwork", 2, PillarId.foundation, False),
        _seed_task("Ship pricing experiment", 4, PillarId.drive, False),
        _seed_task("Systems design study block", 3, PillarId.drive, True),
        _seed_task("Investor narrative rewrite", 2, PillarId.drive, False),
        _seed_task("Analog photo walk", 2, PillarId.joy, False),
        _seed_task("Slow dinner, no screens", 2, PillarId.joy, True),
        _seed_task("Vinyl + reading hour", 1.5, PillarId.joy, False),
    ]

    seed_states = [
        StateId.passivity,
        StateId.relaxation,
        StateId.balance,
        StateId.engagement,
        StateId.overarousal,
        StateId.balance,
        StateId.relaxation,
        StateId.apathy,
        StateId.passivity,
        StateId.balance,
        StateId.engagement,
        StateId.engagement,
        StateId.panic,
        StateId.relaxation,
    ]
    logs = [
        DayLog(day=i + 1, state=seed_states[i] if i < len(seed_states) else None) for i in range(21)
    ]

    archive = [
        ArchivedSprint(
            id=str(uuid.uuid4()),
            name="Sprint #0 - Recalibration",
            range="12 Jun - 3 Jul",
            dominant=StateId.balance,
            completion=78,
            insight="Protecting sleep moved every other metric more than any productivity hack.",
        ),
        ArchivedSprint(
            id=str(uuid.uuid4()),
            name="Sprint #-1 - Launch push",
            range="20 May - 10 Jun",
            dominant=StateId.overarousal,
            completion=64,
            insight="I treat urgency as identity. Distress days clustered around unclear scope.",
        ),
    ]

    return SprintData(
        sprintNumber=1,
        day=8,
        tasks=tasks,
        logs=logs,
        priorities=[],
        gratitude="",
        committed=True,
        archive=archive,
    )


def create_store(database_url: str | None = None) -> Store:
    """A fresh store backed by `database_url` (falls back to the
    `NEUROSPRINT_DATABASE_URL` env var, then a local SQLite file - see
    `app/db.py`), seeded with a demo user (see `DEMO_EMAIL`/`DEMO_PASSWORD`)
    who already owns a sprint. Newly registered users start with no sprint
    (`GET /sprints/current` returns 404 for them), matching the spec.
    """
    url = database_url or os.environ.get("NEUROSPRINT_DATABASE_URL", DEFAULT_DATABASE_URL)
    engine = make_engine(url)
    init_db(engine)
    store = Store(make_session_factory(engine))
    if store.get_user_by_email(DEMO_EMAIL) is None:
        demo = store.create_user(DEMO_EMAIL, DEMO_PASSWORD)
        store.save_sprint(demo.id, _seed_sprint_data())
    return store
