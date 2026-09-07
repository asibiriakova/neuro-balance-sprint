"""Pydantic schemas mirroring the components in ``openapi.yaml``.

Names and shapes are kept in lockstep with the spec's `components.schemas`
section, plus a few request/response models for the auth endpoints, which
the spec doesn't define (see `app/routers/auth.py`).
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class StateId(str, Enum):
    """One of the 7 NeuroBalance states, in escalation order."""

    apathy = "apathy"
    passivity = "passivity"
    relaxation = "relaxation"
    balance = "balance"
    engagement = "engagement"
    overarousal = "overarousal"
    panic = "panic"


class PillarId(str, Enum):
    """One of the 3 sprint pillars."""

    foundation = "foundation"
    drive = "drive"
    joy = "joy"


class Task(BaseModel):
    id: str
    title: str
    hours: float = Field(ge=0, description="Estimated hours, counted against the 10h/pillar and 30h/sprint caps.")
    pillar: PillarId
    done: bool


class NewTaskInput(BaseModel):
    title: str
    hours: float = Field(ge=0)
    pillar: PillarId


class DayLog(BaseModel):
    day: int = Field(ge=1, le=21)
    state: StateId | None = None
    priorities: list[str] = Field(default_factory=list, description="Task ids marked as top-3 priorities on this day.")
    gratitude: str | None = None


class ArchivedSprint(BaseModel):
    id: str
    name: str
    range: str = Field(description='Human-readable date range, e.g. "12 Jun – 3 Jul".')
    dominant: StateId
    completion: float = Field(description="Completion percentage (0-100).")
    insight: str


class SprintData(BaseModel):
    """Everything the app persists for the active 21-day sprint."""

    sprintNumber: int
    day: int = Field(ge=1, le=21)
    tasks: list[Task]
    logs: list[DayLog]
    priorities: list[str] = Field(default_factory=list, max_length=3)
    gratitude: str = ""
    committed: bool
    archive: list[ArchivedSprint]


class PlanningSuggestion(BaseModel):
    title: str
    hours: float = Field(ge=0)
    pillar: PillarId


class PlanningReply(BaseModel):
    text: str
    suggestions: list[PlanningSuggestion] = Field(default_factory=list)


# -- request bodies for the sprint/planning endpoints -----------------------


class SetStateRequest(BaseModel):
    # Kept as a plain str (not StateId) so an invalid value can be reported
    # as the spec's documented 400 rather than FastAPI's default 422.
    state: str


class SetGratitudeRequest(BaseModel):
    value: str


class PlanningPromptRequest(BaseModel):
    prompt: str


# -- auth: not part of openapi.yaml, but needed to obtain a bearer token ----


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
