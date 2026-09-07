"""SQLAlchemy ORM tables backing `app/store.py`.

One table per shape in `app/models.py`, normalized with real foreign keys
rather than a single JSON blob, so a later reporting query (e.g. "average
completion across all archived sprints") is a normal SQL query instead of
an in-Python scan. Nothing here is SQLite-specific - the `JSON` column
type maps to Postgres's native `json`/`jsonb` and to a `TEXT` column
(de)serialized by SQLAlchemy on SQLite, and every other column is a plain
scalar type every SQL dialect supports.
"""

from __future__ import annotations

from sqlalchemy import JSON, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class UserRow(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str]

    tokens: Mapped[list["TokenRow"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    sprint: Mapped["SprintRow | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )


class TokenRow(Base):
    __tablename__ = "tokens"

    token: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)

    user: Mapped["UserRow"] = relationship(back_populates="tokens")


class SprintRow(Base):
    """A user's single active sprint - `user_id` is both the foreign key
    and the primary key, since the app only ever keeps one per user.
    """

    __tablename__ = "sprints"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    sprint_number: Mapped[int]
    day: Mapped[int]
    priorities: Mapped[list[str]] = mapped_column(JSON, default=list)
    gratitude: Mapped[str] = mapped_column(default="")
    committed: Mapped[bool] = mapped_column(default=False)

    user: Mapped["UserRow"] = relationship(back_populates="sprint")
    tasks: Mapped[list["TaskRow"]] = relationship(
        back_populates="sprint", cascade="all, delete-orphan", order_by="TaskRow.position"
    )
    logs: Mapped[list["DayLogRow"]] = relationship(
        back_populates="sprint", cascade="all, delete-orphan", order_by="DayLogRow.day"
    )
    archive: Mapped[list["ArchivedSprintRow"]] = relationship(
        back_populates="sprint", cascade="all, delete-orphan", order_by="ArchivedSprintRow.position"
    )


class TaskRow(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(primary_key=True)
    sprint_id: Mapped[str] = mapped_column(ForeignKey("sprints.user_id"), index=True)
    position: Mapped[int] = mapped_column(Integer)  # preserves creation order
    title: Mapped[str]
    hours: Mapped[float]
    pillar: Mapped[str]
    done: Mapped[bool] = mapped_column(default=False)

    sprint: Mapped["SprintRow"] = relationship(back_populates="tasks")


class DayLogRow(Base):
    __tablename__ = "day_logs"
    __table_args__ = (UniqueConstraint("sprint_id", "day"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sprint_id: Mapped[str] = mapped_column(ForeignKey("sprints.user_id"), index=True)
    day: Mapped[int]
    state: Mapped[str | None] = mapped_column(default=None)
    priorities: Mapped[list[str]] = mapped_column(JSON, default=list)
    gratitude: Mapped[str | None] = mapped_column(default=None)

    sprint: Mapped["SprintRow"] = relationship(back_populates="logs")


class ArchivedSprintRow(Base):
    __tablename__ = "archived_sprints"

    id: Mapped[str] = mapped_column(primary_key=True)
    sprint_id: Mapped[str] = mapped_column(ForeignKey("sprints.user_id"), index=True)
    position: Mapped[int] = mapped_column(Integer)  # preserves archival order
    name: Mapped[str]
    range: Mapped[str]
    dominant: Mapped[str]
    completion: Mapped[float]
    insight: Mapped[str]

    sprint: Mapped["SprintRow"] = relationship(back_populates="archive")
