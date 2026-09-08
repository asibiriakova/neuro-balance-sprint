import { uid } from "@/lib/neuro";
import type { AssistantReply } from "../types";

/** Deterministic stand-in for a real AI backend. */
export function mockAssistantReply(prompt: string): AssistantReply {
  const p = prompt.toLowerCase();

  if (p.includes("fitness") || p.includes("health"))
    return {
      id: uid(),
      text: "Fitness is a Foundation goal. Split it into recoverable micro-blocks so the sprint stays under 10h:",
      suggestions: [
        { title: "Zone-2 cardio ×3 / week", hours: 3, pillar: "foundation" },
        { title: "Strength session ×2 / week", hours: 3, pillar: "foundation" },
        { title: "Evening mobility 10 min", hours: 2, pillar: "foundation" },
      ],
    };

  if (p.includes("drive") || p.includes("career") || p.includes("skill"))
    return {
      id: uid(),
      text: "Here is a 10h Drive backlog with one ambitious leap and two supporting blocks:",
      suggestions: [
        { title: "Ambitious leap: publish case study", hours: 4, pillar: "drive" },
        { title: "Deep-work skill block ×3", hours: 4, pillar: "drive" },
        { title: "Weekly review + next-step mapping", hours: 2, pillar: "drive" },
      ],
    };

  if (p.includes("balance") || p.includes("load"))
    return {
      id: uid(),
      text: "Your Drive column carries the highest cognitive cost. Add sensory recovery so the prefrontal cortex stays online:",
      suggestions: [
        { title: "Screen-free walk after deep work", hours: 2, pillar: "joy" },
        { title: "Sensory recovery: sauna or bath", hours: 2, pillar: "joy" },
        { title: "Protected 8h sleep window", hours: 3, pillar: "foundation" },
      ],
    };

  return {
    id: uid(),
    text: "Let's decompose that. Here are three micro-tasks sized for a 21-day sprint:",
    suggestions: [
      { title: `${prompt.slice(0, 38)} — first visible step`, hours: 2, pillar: "drive" },
      { title: `${prompt.slice(0, 38)} — recurring practice`, hours: 3, pillar: "foundation" },
      { title: `${prompt.slice(0, 38)} — celebrate progress`, hours: 1, pillar: "joy" },
    ],
  };
}
