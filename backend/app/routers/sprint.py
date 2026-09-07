"""`/sprints/current*` - backs `SprintService`.

Every endpoint here is scoped to the authenticated caller's own sprint (one
active sprint per user), per the spec's description.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user, get_store
from app.models import NewTaskInput, SetGratitudeRequest, SetStateRequest, SprintData, StateId, Task
from app.store import Store, UserRecord

router = APIRouter(prefix="/api/sprints/current", tags=["sprint"])

PILLAR_CAP_HOURS = 10
SPRINT_CAP_HOURS = 30


def _get_sprint_or_404(store: Store, user: UserRecord) -> SprintData:
    sprint = store.get_sprint(user.id)
    if sprint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active sprint")
    return sprint


def _find_task_or_404(sprint: SprintData, task_id: str) -> Task:
    for task in sprint.tasks:
        if task.id == task_id:
            return task
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.get("", response_model=SprintData)
def get_current_sprint(
    user: UserRecord = Depends(get_current_user),
    store: Store = Depends(get_store),
) -> SprintData:
    return _get_sprint_or_404(store, user)


@router.post("/state", response_model=SprintData)
def set_today_state(
    body: SetStateRequest,
    user: UserRecord = Depends(get_current_user),
    store: Store = Depends(get_store),
) -> SprintData:
    sprint = _get_sprint_or_404(store, user)
    try:
        state = StateId(body.state)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state value") from None

    for log in sprint.logs:
        if log.day == sprint.day:
            log.state = state
    return store.save_sprint(user.id, sprint)


@router.post("/tasks", response_model=SprintData)
def add_task(
    body: NewTaskInput,
    user: UserRecord = Depends(get_current_user),
    store: Store = Depends(get_store),
) -> SprintData:
    sprint = _get_sprint_or_404(store, user)

    pillar_hours = sum(t.hours for t in sprint.tasks if t.pillar == body.pillar) + body.hours
    if pillar_hours > PILLAR_CAP_HOURS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Adding this task would exceed the {PILLAR_CAP_HOURS}h cap for '{body.pillar.value}'",
        )

    total_hours = sum(t.hours for t in sprint.tasks) + body.hours
    if total_hours > SPRINT_CAP_HOURS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Adding this task would exceed the {SPRINT_CAP_HOURS}h sprint cap",
        )

    sprint.tasks.append(Task(id=str(uuid.uuid4()), title=body.title, hours=body.hours, pillar=body.pillar, done=False))
    return store.save_sprint(user.id, sprint)


@router.patch("/tasks/{task_id}/toggle-done", response_model=SprintData)
def toggle_task(
    task_id: str,
    user: UserRecord = Depends(get_current_user),
    store: Store = Depends(get_store),
) -> SprintData:
    sprint = _get_sprint_or_404(store, user)
    task = _find_task_or_404(sprint, task_id)
    task.done = not task.done
    return store.save_sprint(user.id, sprint)


@router.patch("/tasks/{task_id}/toggle-priority", response_model=SprintData)
def toggle_priority(
    task_id: str,
    user: UserRecord = Depends(get_current_user),
    store: Store = Depends(get_store),
) -> SprintData:
    sprint = _get_sprint_or_404(store, user)
    _find_task_or_404(sprint, task_id)  # 404s on an unknown task id

    if task_id in sprint.priorities:
        sprint.priorities.remove(task_id)
    elif len(sprint.priorities) < 3:
        sprint.priorities.append(task_id)
    # else: already at the 3-priority cap - silent no-op, matching
    # MockSprintService.togglePriority.
    return store.save_sprint(user.id, sprint)


@router.put("/gratitude", response_model=SprintData)
def set_gratitude(
    body: SetGratitudeRequest,
    user: UserRecord = Depends(get_current_user),
    store: Store = Depends(get_store),
) -> SprintData:
    sprint = _get_sprint_or_404(store, user)
    sprint.gratitude = body.value
    return store.save_sprint(user.id, sprint)
