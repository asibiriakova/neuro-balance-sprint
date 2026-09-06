export type StateId =
  | "apathy"
  | "passivity"
  | "relaxation"
  | "balance"
  | "engagement"
  | "overarousal"
  | "panic";

export type ZoneId = "burnout" | "integration" | "distress";

export interface NeuroState {
  id: StateId;
  label: string;
  ru: string;
  zone: ZoneId;
  token: string; // css var name
}

export const STATES: NeuroState[] = [
  { id: "apathy", label: "Apathy", ru: "Апатия", zone: "burnout", token: "--state-apathy" },
  { id: "passivity", label: "Passivity", ru: "Пассивность", zone: "burnout", token: "--state-passivity" },
  { id: "relaxation", label: "Relaxation", ru: "Расслабленность", zone: "integration", token: "--state-relaxation" },
  { id: "balance", label: "Balance", ru: "Баланс", zone: "integration", token: "--state-balance" },
  { id: "engagement", label: "Engagement", ru: "Включенность", zone: "integration", token: "--state-engagement" },
  { id: "overarousal", label: "Overarousal", ru: "Перевозбуждение", zone: "distress", token: "--state-overarousal" },
  { id: "panic", label: "Panic", ru: "Паника", zone: "distress", token: "--state-panic" },
];

export const ZONES: Record<ZoneId, { label: string; ru: string; blurb: string }> = {
  burnout: {
    label: "Burnout Zone",
    ru: "Гипоактивация · Freeze",
    blurb: "Dorsal shutdown. Energy is conserved, motivation is offline.",
  },
  integration: {
    label: "Integration Zone",
    ru: "Оптимальное окно",
    blurb: "Prefrontal cortex engaged. Clear thinking, flexible attention.",
  },
  distress: {
    label: "Distress Zone",
    ru: "Гиперактивация · Amygdala",
    blurb: "Fight-or-flight. Narrow focus, reactive decisions.",
  },
};

export const stateColor = (id: StateId) => `var(${STATES.find((s) => s.id === id)!.token})`;
export const stateById = (id: StateId) => STATES.find((s) => s.id === id)!;

export type PillarId = "foundation" | "drive" | "joy";

export const PILLARS: { id: PillarId; label: string; ru: string; icon: string; blurb: string }[] = [
  {
    id: "foundation",
    label: "Foundation",
    ru: "Фундамент",
    icon: "🛡️",
    blurb: "Health, sleep, physiology",
  },
  { id: "drive", label: "Drive", ru: "Драйв", icon: "⚡", blurb: "Skills, ambitious leaps, career" },
  { id: "joy", label: "Joy", ru: "Кайф", icon: "✨", blurb: "Present-moment enjoyment, recovery" },
];

export const PILLAR_CAP = 10;
export const SPRINT_CAP = 30;

export interface Task {
  id: string;
  title: string;
  hours: number;
  pillar: PillarId;
  done: boolean;
}

export interface DayLog {
  day: number; // 1..21
  state: StateId | null;
  priorities?: string[];
  gratitude?: string;
}

export interface ArchivedSprint {
  id: string;
  name: string;
  range: string;
  dominant: StateId;
  completion: number;
  insight: string;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
