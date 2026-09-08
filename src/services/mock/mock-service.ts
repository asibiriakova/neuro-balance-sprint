import { uid, type ArchivedSprint } from "@/lib/neuro";
import { seedArchive, seedSprint } from "../seed";
import type {
  JoyPassanaConfig,
  NeuroSprintService,
  ReflectionEntry,
  SprintSnapshot,
} from "../types";
import { mockAssistantReply } from "./assistant";

const KEY = "neurosprint:v1";

interface Db {
  sprint: SprintSnapshot;
  archive: ArchivedSprint[];
  reflections: ReflectionEntry[];
  joyPassana: JoyPassanaConfig | null;
}

const freshDb = (): Db => ({
  sprint: seedSprint(),
  archive: seedArchive(),
  reflections: [],
  joyPassana: null,
});

const delay = (ms = 60) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * In-memory + localStorage implementation of the service layer.
 * Lets the entire app run with no real backend attached.
 */
export function createMockService(): NeuroSprintService {
  let db: Db | null = null;

  const canPersist = () => typeof window !== "undefined";

  const load = (): Db => {
    if (db) return db;
    const fresh = freshDb();
    if (!canPersist()) {
      db = fresh;
      return db;
    }
    try {
      const raw = window.localStorage.getItem(KEY);
      db = raw ? { ...fresh, ...(JSON.parse(raw) as Partial<Db>) } : fresh;
    } catch {
      db = fresh;
    }
    return db;
  };

  const persist = () => {
    if (!canPersist() || !db) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* storage unavailable — keep working in memory */
    }
  };

  const mutate = async (fn: (sprint: SprintSnapshot) => SprintSnapshot) => {
    const d = load();
    d.sprint = fn(d.sprint);
    persist();
    await delay();
    return d.sprint;
  };

  return {
    name: "mock",

    async getSprint() {
      await delay();
      return load().sprint;
    },

    async saveSprint(snapshot) {
      return mutate(() => snapshot);
    },

    async setTodayState(state) {
      return mutate((s) => ({
        ...s,
        logs: s.logs.map((l) => (l.day === s.day ? { ...l, state } : l)),
      }));
    },

    async addTask(task) {
      return mutate((s) => ({
        ...s,
        tasks: [...s.tasks, { ...task, id: uid(), done: false }],
      }));
    },

    async toggleTask(taskId) {
      return mutate((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
      }));
    },

    async togglePriority(taskId) {
      return mutate((s) => {
        if (s.priorities.includes(taskId))
          return { ...s, priorities: s.priorities.filter((p) => p !== taskId) };
        if (s.priorities.length >= 3) return s;
        return { ...s, priorities: [...s.priorities, taskId] };
      });
    },

    async setGratitude(text) {
      return mutate((s) => ({ ...s, gratitude: text }));
    },

    async commitSprint() {
      return mutate((s) => ({ ...s, committed: true }));
    },

    async listArchive() {
      await delay();
      return load().archive;
    },

    async listReflections() {
      await delay();
      return load().reflections;
    },

    async saveReflection(entry) {
      const d = load();
      const saved: ReflectionEntry = {
        ...entry,
        id: uid(),
        sprintNumber: d.sprint.sprintNumber,
        createdAt: new Date().toISOString(),
      };
      d.reflections = [saved, ...d.reflections];
      persist();
      await delay();
      return saved;
    },

    async saveJoyPassana(config) {
      const d = load();
      d.joyPassana = config;
      persist();
      await delay();
      return config;
    },

    async askAssistant(prompt) {
      await delay(320);
      return mockAssistantReply(prompt);
    },
  };
}
