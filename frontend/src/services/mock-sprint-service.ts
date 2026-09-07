import { uid, type StateId } from "@/lib/neuro";
import type { NewTaskInput, SprintData, SprintService } from "./sprint-service";

const STORAGE_KEY = "neurosprint:v1";

const seedTasks: SprintData["tasks"] = [
  { id: uid(), title: "Sleep window 23:00–07:00", hours: 3, pillar: "foundation", done: true },
  { id: uid(), title: "Zone-2 cardio ×3", hours: 3, pillar: "foundation", done: false },
  { id: uid(), title: "Mobility + breathwork", hours: 2, pillar: "foundation", done: false },
  { id: uid(), title: "Ship pricing experiment", hours: 4, pillar: "drive", done: false },
  { id: uid(), title: "Systems design study block", hours: 3, pillar: "drive", done: true },
  { id: uid(), title: "Investor narrative rewrite", hours: 2, pillar: "drive", done: false },
  { id: uid(), title: "Analog photo walk", hours: 2, pillar: "joy", done: false },
  { id: uid(), title: "Slow dinner, no screens", hours: 2, pillar: "joy", done: true },
  { id: uid(), title: "Vinyl + reading hour", hours: 1.5, pillar: "joy", done: false },
];

const seedStates: StateId[] = [
  "passivity",
  "relaxation",
  "balance",
  "engagement",
  "overarousal",
  "balance",
  "relaxation",
  "apathy",
  "passivity",
  "balance",
  "engagement",
  "engagement",
  "panic",
  "relaxation",
];

const seedLogs: SprintData["logs"] = Array.from({ length: 21 }, (_, i) => ({
  day: i + 1,
  state: i < seedStates.length ? seedStates[i]! : null,
}));

function seedData(): SprintData {
  return {
    sprintNumber: 1,
    day: 8,
    tasks: seedTasks,
    logs: seedLogs,
    priorities: [],
    gratitude: "",
    committed: true,
    archive: [
      {
        id: uid(),
        name: "Sprint #0 · Recalibration",
        range: "12 Jun – 3 Jul",
        dominant: "balance",
        completion: 78,
        insight: "Protecting sleep moved every other metric more than any productivity hack.",
      },
      {
        id: uid(),
        name: "Sprint #-1 · Launch push",
        range: "20 May – 10 Jun",
        dominant: "overarousal",
        completion: 64,
        insight: "I treat urgency as identity. Distress days clustered around unclear scope.",
      },
    ],
  };
}

/**
 * localStorage-backed stand-in for a real sprint backend. Keeps the whole
 * app usable with zero server: every SprintService call reads/writes a
 * single JSON blob synchronously under the hood, but is exposed as async
 * so a future HTTP implementation is a drop-in replacement.
 */
export class MockSprintService implements SprintService {
  private data: SprintData | null = null;

  constructor(
    private readonly storageKey: string = STORAGE_KEY,
    private readonly storage: Storage | null = typeof localStorage !== "undefined"
      ? localStorage
      : null,
  ) {}

  private read(): SprintData {
    if (this.data) return this.data;
    let data = seedData();
    try {
      const raw = this.storage?.getItem(this.storageKey);
      if (raw) data = { ...data, ...(JSON.parse(raw) as Partial<SprintData>) };
    } catch {
      /* ignore corrupt/unavailable storage, fall back to seed data */
    }
    this.data = data;
    return data;
  }

  private write(data: SprintData): SprintData {
    this.data = data;
    try {
      this.storage?.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      /* ignore unavailable storage (private mode, quota, SSR, ...) */
    }
    return data;
  }

  async getSprint(): Promise<SprintData> {
    return this.read();
  }

  async setTodayState(state: StateId): Promise<SprintData> {
    const current = this.read();
    return this.write({
      ...current,
      logs: current.logs.map((l) => (l.day === current.day ? { ...l, state } : l)),
    });
  }

  async toggleTask(taskId: string): Promise<SprintData> {
    const current = this.read();
    return this.write({
      ...current,
      tasks: current.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    });
  }

  async addTask(task: NewTaskInput): Promise<SprintData> {
    const current = this.read();
    return this.write({
      ...current,
      tasks: [...current.tasks, { ...task, id: uid(), done: false }],
    });
  }

  async togglePriority(taskId: string): Promise<SprintData> {
    const current = this.read();
    const has = current.priorities.includes(taskId);
    if (has)
      return this.write({ ...current, priorities: current.priorities.filter((p) => p !== taskId) });
    if (current.priorities.length >= 3) return current;
    return this.write({ ...current, priorities: [...current.priorities, taskId] });
  }

  async setGratitude(value: string): Promise<SprintData> {
    const current = this.read();
    return this.write({ ...current, gratitude: value });
  }
}

/** The service instance the app uses today, in place of a real backend. */
export const sprintService: SprintService = new MockSprintService();
