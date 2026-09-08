import type { ArchivedSprint, DayLog, PillarId, StateId, Task } from "@/lib/neuro";

/** Everything the app knows about the sprint currently in progress. */
export interface SprintSnapshot {
  sprintNumber: number;
  day: number;
  tasks: Task[];
  logs: DayLog[];
  priorities: string[];
  gratitude: string;
  committed: boolean;
}

export interface ReflectionEntry {
  id: string;
  sprintNumber: number;
  keyChange: string;
  actions: string;
  insight: string;
  opportunities: string;
  createdAt: string;
}

export interface JoyPassanaConfig {
  duration: string;
  checklist: string[];
}

export interface AssistantSuggestion {
  title: string;
  hours: number;
  pillar: PillarId;
}

export interface AssistantReply {
  id: string;
  text: string;
  suggestions?: AssistantSuggestion[];
}

/**
 * The single boundary between the UI and any backend.
 * Components and stores must never talk to storage, HTTP or AI directly —
 * they always go through an implementation of this interface.
 */
export interface NeuroSprintService {
  /** Name of the active implementation, e.g. "mock". */
  readonly name: string;

  // ----- sprint -----
  getSprint(): Promise<SprintSnapshot>;
  saveSprint(snapshot: SprintSnapshot): Promise<SprintSnapshot>;
  setTodayState(state: StateId): Promise<SprintSnapshot>;
  addTask(task: { title: string; hours: number; pillar: PillarId }): Promise<SprintSnapshot>;
  toggleTask(taskId: string): Promise<SprintSnapshot>;
  togglePriority(taskId: string): Promise<SprintSnapshot>;
  setGratitude(text: string): Promise<SprintSnapshot>;
  commitSprint(): Promise<SprintSnapshot>;

  // ----- archive & reflection -----
  listArchive(): Promise<ArchivedSprint[]>;
  listReflections(): Promise<ReflectionEntry[]>;
  saveReflection(
    entry: Omit<ReflectionEntry, "id" | "createdAt" | "sprintNumber">,
  ): Promise<ReflectionEntry>;
  saveJoyPassana(config: JoyPassanaConfig): Promise<JoyPassanaConfig>;

  // ----- assistant -----
  askAssistant(prompt: string): Promise<AssistantReply>;
}
