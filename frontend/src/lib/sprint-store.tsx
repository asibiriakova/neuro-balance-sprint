import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  uid,
  type ArchivedSprint,
  type DayLog,
  type PillarId,
  type StateId,
  type Task,
} from "./neuro";

interface SprintData {
  sprintNumber: number;
  day: number;
  tasks: Task[];
  logs: DayLog[];
  priorities: string[];
  gratitude: string;
  committed: boolean;
  archive: ArchivedSprint[];
}

const seedTasks: Task[] = [
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

const seedLogs: DayLog[] = Array.from({ length: 21 }, (_, i) => ({
  day: i + 1,
  state: i < seedStates.length ? seedStates[i]! : null,
}));

const initial: SprintData = {
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

interface Ctx extends SprintData {
  todayState: StateId | null;
  setTodayState: (s: StateId) => void;
  toggleTask: (id: string) => void;
  addTask: (t: { title: string; hours: number; pillar: PillarId }) => void;
  togglePriority: (id: string) => void;
  setGratitude: (v: string) => void;
  hoursByPillar: Record<PillarId, number>;
}

const SprintContext = createContext<Ctx | null>(null);
const KEY = "neurosprint:v1";

export function SprintProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SprintData>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData({ ...initial, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const value = useMemo<Ctx>(() => {
    const hoursByPillar = data.tasks.reduce(
      (acc, t) => {
        acc[t.pillar] += t.hours;
        return acc;
      },
      { foundation: 0, drive: 0, joy: 0 } as Record<PillarId, number>,
    );

    return {
      ...data,
      hoursByPillar,
      todayState: data.logs.find((l) => l.day === data.day)?.state ?? null,
      setTodayState: (s) =>
        setData((d) => ({
          ...d,
          logs: d.logs.map((l) => (l.day === d.day ? { ...l, state: s } : l)),
        })),
      toggleTask: (id) =>
        setData((d) => ({
          ...d,
          tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      addTask: (t) =>
        setData((d) => ({ ...d, tasks: [...d.tasks, { ...t, id: uid(), done: false }] })),
      togglePriority: (id) =>
        setData((d) => {
          const has = d.priorities.includes(id);
          if (has) return { ...d, priorities: d.priorities.filter((p) => p !== id) };
          if (d.priorities.length >= 3) return d;
          return { ...d, priorities: [...d.priorities, id] };
        }),
      setGratitude: (v) => setData((d) => ({ ...d, gratitude: v })),
    };
  }, [data]);

  return <SprintContext.Provider value={value}>{children}</SprintContext.Provider>;
}

export function useSprint() {
  const ctx = useContext(SprintContext);
  if (!ctx) throw new Error("useSprint must be used inside SprintProvider");
  return ctx;
}
