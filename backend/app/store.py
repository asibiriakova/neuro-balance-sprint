"""In-memory persistence.

A real deployment is meant to sit on Postgres (see `_docs/plan.md`), but for
this stage of the project a process-local store is enough to make the API
real: it holds users, issued bearer tokens, and each user's sprint, and is
reset whenever the process restarts. `create_store()` seeds a demo user and
sprint so the API (and the frontend behind it) has something to show without
any setup step.
"""

from __future__ import annotations

import secrets
import uuid
from dataclasses import dataclass

from app.auth import hash_password
from app.models import ArchivedSprint, DayLog, PillarId, SprintData, StateId, Task

DEMO_EMAIL = "demo@neurosprint.app"
DEMO_PASSWORD = "sprint-demo-pw"


@dataclass
class UserRecord:
    id: str
    email: str
    hashed_password: str


class InMemoryStore:
    def __init__(self) -> None:
        self._users_by_email: dict[str, UserRecord] = {}
        self._users_by_id: dict[str, UserRecord] = {}
        self._tokens: dict[str, str] = {}  # token -> user id
        self._sprints: dict[str, SprintData] = {}  # user id -> sprint

    # -- users ----------------------------------------------------------

    def create_user(self, email: str, password: str) -> UserRecord:
        if email in self._users_by_email:
            raise ValueError(f"email already registered: {email}")
        user = UserRecord(id=str(uuid.uuid4()), email=email, hashed_password=hash_password(password))
        self._users_by_email[email] = user
        self._users_by_id[user.id] = user
        return user

    def get_user_by_email(self, email: str) -> UserRecord | None:
        return self._users_by_email.get(email)

    def get_user_by_id(self, user_id: str) -> UserRecord | None:
        return self._users_by_id.get(user_id)

    # -- tokens -----------------------------------------------------------

    def issue_token(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        self._tokens[token] = user_id
        return token

    def user_id_for_token(self, token: str) -> str | None:
        return self._tokens.get(token)

    # -- sprints ------------------------------------------------------------

    def get_sprint(self, user_id: str) -> SprintData | None:
        return self._sprints.get(user_id)

    def save_sprint(self, user_id: str, sprint: SprintData) -> SprintData:
        self._sprints[user_id] = sprint
        return sprint


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


def create_store() -> InMemoryStore:
    """A fresh store, seeded with a demo user (see `DEMO_EMAIL`/`DEMO_PASSWORD`)
    who already owns a sprint. Newly registered users start with no sprint
    (`GET /sprints/current` returns 404 for them), matching the spec.
    """
    store = InMemoryStore()
    demo = store.create_user(DEMO_EMAIL, DEMO_PASSWORD)
    store.save_sprint(demo.id, _seed_sprint_data())
    return store
