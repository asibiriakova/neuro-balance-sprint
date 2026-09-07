"""`/planning/assistant` - backs `PlanningService.getAssistantReply`.

Keyword-matched, deterministic reply generation, ported from the frontend's
`MockPlanningService` so the API is useful without wiring up the real
Gemini proxy `_docs/plan.md` describes for a later phase.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.models import PillarId, PlanningPromptRequest, PlanningReply, PlanningSuggestion
from app.store import UserRecord

router = APIRouter(prefix="/api/planning", tags=["planning"])


def _reply_for(prompt: str) -> PlanningReply:
    p = prompt.lower()

    if "fitness" in p or "health" in p:
        return PlanningReply(
            text=(
                "Fitness is a Foundation goal. Split it into recoverable "
                "micro-blocks so the sprint stays under 10h:"
            ),
            suggestions=[
                PlanningSuggestion(title="Zone-2 cardio x3 / week", hours=3, pillar=PillarId.foundation),
                PlanningSuggestion(title="Strength session x2 / week", hours=3, pillar=PillarId.foundation),
                PlanningSuggestion(title="Evening mobility 10 min", hours=2, pillar=PillarId.foundation),
            ],
        )

    if "drive" in p or "career" in p or "skill" in p:
        return PlanningReply(
            text="Here is a 10h Drive backlog with one ambitious leap and two supporting blocks:",
            suggestions=[
                PlanningSuggestion(title="Ambitious leap: publish case study", hours=4, pillar=PillarId.drive),
                PlanningSuggestion(title="Deep-work skill block x3", hours=4, pillar=PillarId.drive),
                PlanningSuggestion(title="Weekly review + next-step mapping", hours=2, pillar=PillarId.drive),
            ],
        )

    if "balance" in p or "load" in p:
        return PlanningReply(
            text=(
                "Your Drive column carries the highest cognitive cost. Add sensory "
                "recovery so the prefrontal cortex stays online:"
            ),
            suggestions=[
                PlanningSuggestion(title="Screen-free walk after deep work", hours=2, pillar=PillarId.joy),
                PlanningSuggestion(title="Sensory recovery: sauna or bath", hours=2, pillar=PillarId.joy),
                PlanningSuggestion(title="Protected 8h sleep window", hours=3, pillar=PillarId.foundation),
            ],
        )

    stub = prompt[:38]
    return PlanningReply(
        text="Let's decompose that. Here are three micro-tasks sized for a 21-day sprint:",
        suggestions=[
            PlanningSuggestion(title=f"{stub} - first visible step", hours=2, pillar=PillarId.drive),
            PlanningSuggestion(title=f"{stub} - recurring practice", hours=3, pillar=PillarId.foundation),
            PlanningSuggestion(title=f"{stub} - celebrate progress", hours=1, pillar=PillarId.joy),
        ],
    )


@router.post("/assistant", response_model=PlanningReply)
def get_assistant_reply(
    body: PlanningPromptRequest,
    user: UserRecord = Depends(get_current_user),
) -> PlanningReply:
    del user  # auth-gated per the spec; the reply doesn't depend on identity
    return _reply_for(body.prompt)
