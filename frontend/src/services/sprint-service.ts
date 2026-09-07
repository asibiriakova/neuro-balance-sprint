import type { ArchivedSprint, DayLog, PillarId, StateId, Task } from "@/lib/neuro";

/**
 * Everything the app currently persists for the active 21-day sprint.
 * This is the shape a real backend resource (e.g. `GET /sprints/current`)
 * would return.
 */
export interface SprintData {
  sprintNumber: number;
  day: number;
  tasks: Task[];
  logs: DayLog[];
  priorities: string[];
  gratitude: string;
  committed: boolean;
  archive: ArchivedSprint[];
}

export interface NewTaskInput {
  title: string;
  hours: number;
  pillar: PillarId;
}

/**
 * The single contract every backend call for sprint data goes through.
 * `MockSprintService` (see mock-sprint-service.ts) is the only implementation
 * today; a future HTTP-backed implementation can drop in behind this same
 * interface without touching any component.
 */
export interface SprintService {
  /** Fetches the current sprint's state. */
  getSprint(): Promise<SprintData>;
  /** Logs today's NeuroBalance state and returns the updated sprint. */
  setTodayState(state: StateId): Promise<SprintData>;
  /** Toggles a task's completion status and returns the updated sprint. */
  toggleTask(taskId: string): Promise<SprintData>;
  /** Adds a new task to the sprint and returns the updated sprint. */
  addTask(task: NewTaskInput): Promise<SprintData>;
  /** Toggles a task in/out of today's top-3 priorities (capped at 3). */
  togglePriority(taskId: string): Promise<SprintData>;
  /** Saves today's "remarkable moment" gratitude note. */
  setGratitude(value: string): Promise<SprintData>;
}
