import type { PillarId } from "@/lib/neuro";

export interface PlanningSuggestion {
  title: string;
  hours: number;
  pillar: PillarId;
}

export interface PlanningReply {
  text: string;
  suggestions?: PlanningSuggestion[];
}

/**
 * The single contract the Planning Canvas's AI assistant goes through.
 * `MockPlanningService` (see mock-planning-service.ts) answers with
 * canned, keyword-matched decompositions today; a future implementation
 * backed by a real LLM endpoint (see _docs/plan.md's Gemini wrapper) can
 * drop in behind this same interface without touching planning.tsx.
 */
export interface PlanningService {
  /** Decomposes a free-text goal into pillar-tagged micro-task suggestions. */
  getAssistantReply(prompt: string): Promise<PlanningReply>;
}
