import { uid, type ArchivedSprint, type DayLog, type StateId, type Task } from "@/lib/neuro";
import type { SprintSnapshot } from "./types";

const seedTasks = (): Task[] => [
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

const seedLogs = (): DayLog[] =>
  Array.from({ length: 21 }, (_, i) => ({
    day: i + 1,
    state: i < seedStates.length ? seedStates[i]! : null,
  }));

export const seedSprint = (): SprintSnapshot => ({
  sprintNumber: 1,
  day: 8,
  tasks: seedTasks(),
  logs: seedLogs(),
  priorities: [],
  gratitude: "",
  committed: true,
});

export const seedArchive = (): ArchivedSprint[] => [
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
];
