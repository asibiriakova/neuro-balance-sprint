import type { PillarId } from "./neuro";

export interface PresetLine {
  pillar: PillarId;
  label: string;
  minutes: number;
  cadence: "weekday" | "weekend";
}

export interface BudgetPreset {
  id: string;
  name: string;
  tagline: string;
  weekdayTotal: number; // minutes per weekday
  weekendTotal: number; // minutes per weekend block
  lines: PresetLine[];
}

// 21-day sprint ≈ 15 weekdays + 3 weekend blocks
export const WEEKDAYS = 15;
export const WEEKEND_BLOCKS = 3;

export const BUDGET_PRESETS: BudgetPreset[] = [
  {
    id: "a",
    name: "1h Weekdays + 2.5h Weekend Deep Dive",
    tagline: "Light on workdays, one long focus block on the weekend.",
    weekdayTotal: 60,
    weekendTotal: 150,
    lines: [
      { pillar: "foundation", label: "Foundation block", minutes: 10, cadence: "weekday" },
      { pillar: "drive", label: "Drive block", minutes: 40, cadence: "weekday" },
      { pillar: "joy", label: "Joy block", minutes: 10, cadence: "weekday" },
      { pillar: "drive", label: "Focus: deep work / projects", minutes: 120, cadence: "weekend" },
      { pillar: "joy", label: "Weekly reflection", minutes: 30, cadence: "weekend" },
    ],
  },
  {
    id: "b",
    name: "1.5h Daily Rhythm",
    tagline: "Even daily rhythm with a balanced weekend block.",
    weekdayTotal: 90,
    weekendTotal: 180,
    lines: [
      { pillar: "foundation", label: "Foundation block", minutes: 30, cadence: "weekday" },
      { pillar: "drive", label: "Drive block", minutes: 40, cadence: "weekday" },
      { pillar: "joy", label: "Joy block", minutes: 20, cadence: "weekday" },
      { pillar: "foundation", label: "Foundation weekend block", minutes: 60, cadence: "weekend" },
      { pillar: "drive", label: "Drive weekend block", minutes: 90, cadence: "weekend" },
      { pillar: "joy", label: "Weekly reflection", minutes: 30, cadence: "weekend" },
    ],
  },
];

export const presetTasks = (p: BudgetPreset) =>
  p.lines.map((l) => {
    const reps = l.cadence === "weekday" ? WEEKDAYS : WEEKEND_BLOCKS;
    const hours = Math.round(((l.minutes * reps) / 60) * 10) / 10;
    return {
      title: `${l.label} · ${l.minutes} min × ${reps}`,
      hours,
      pillar: l.pillar,
    };
  });

export interface IdeaGroup {
  label: string;
  minutes: number; // default hours per task suggestion, in minutes
  items: { emoji: string; en: string; ru: string }[];
}

export const IDEA_BANK: Record<PillarId, IdeaGroup[]> = {
  foundation: [
    {
      label: "⚡ 30-minute micro-blocks",
      minutes: 30,
      items: [
        { emoji: "🎧", en: "Audio guide listening", ru: "Прослушивание аудиогидов" },
        { emoji: "🚶", en: "Refreshing walk", ru: "Прогулка" },
        { emoji: "🧘", en: "Posture exercises", ru: "Упражнения для осанки" },
        { emoji: "🤸", en: "Home yoga & stretching", ru: "Домашняя йога / растяжка" },
        { emoji: "💤", en: "Power nap", ru: "Короткий дневной сон" },
        { emoji: "🫁", en: "Meditation & breathwork", ru: "Медитация / дыхательные практики" },
      ],
    },
    {
      label: "🔋 60-minute deep-blocks",
      minutes: 60,
      items: [
        { emoji: "🏊", en: "Pool & sauna recovery", ru: "Бассейн / сауна" },
        { emoji: "🥾", en: "Outdoor hike", ru: "Прогулка / хайкинг" },
        { emoji: "🧠", en: "Therapy session", ru: "Встреча с психологом" },
        { emoji: "🥗", en: "Weekly healthy meal prep", ru: "Полезные обеды на неделю" },
        { emoji: "💆", en: "Massage session", ru: "Массаж" },
        { emoji: "🩺", en: "Health checkups", ru: "Чекапы по здоровью" },
        { emoji: "🦴", en: "Joint mobility routine", ru: "Подвижность суставов" },
      ],
    },
  ],
  drive: [
    {
      label: "⚡ 30-minute micro-blocks",
      minutes: 30,
      items: [
        { emoji: "🎯", en: "Read 1 industry article or chapter", ru: "Чтение профильной статьи / главы" },
        { emoji: "✍️", en: "Draft system design or project brief", ru: "Архитектурная схема / бриф проекта" },
        { emoji: "🧪", en: "Quick code spike / hypothesis test", ru: "Быстрый тест гипотезы / код-спайк" },
        { emoji: "🤝", en: "Professional outreach or mentor ping", ru: "Сообщение ментору / нетворкинг" },
      ],
    },
    {
      label: "🚀 60–90 minute deep-blocks",
      minutes: 90,
      items: [
        { emoji: "💻", en: "Deep-work engineering sprint", ru: "Блок разработки без отвлечений" },
        { emoji: "📝", en: "Article or talk draft preparation", ru: "Экспертная статья / доклад" },
        { emoji: "🎓", en: "Course module & lab work", ru: "Модуль обучения с практикой" },
        { emoji: "🧭", en: "Strategic career / portfolio milestone", ru: "Стратегия целей / портфолио" },
      ],
    },
  ],
  joy: [
    {
      label: "☕ 15–30 minute micro-blocks",
      minutes: 30,
      items: [
        { emoji: "☕", en: "Mindful slow coffee ritual", ru: "Кофе с сенсорным погружением" },
        { emoji: "🛁", en: "Aromatherapy & home SPA", ru: "Домашний СПА с эфирными маслами" },
        { emoji: "✨", en: "Dressing up & aesthetic grooming", ru: "Нарядиться / эстетический уход" },
        { emoji: "🎧", en: "Active music listening session", ru: "Вдумчивое прослушивание музыки" },
      ],
    },
    {
      label: "🎨 60–120 minute deep-blocks",
      minutes: 120,
      items: [
        { emoji: "🎲", en: "Board game night in safe cocoon", ru: "Настольные игры в уютной компании" },
        { emoji: "📸", en: "Atmospheric photo-walk", ru: "Прогулка с фотоаппаратом" },
        { emoji: "🍲", en: "Cooking dinner for family", ru: "Кулинарный вечер для семьи" },
        { emoji: "🎨", en: "Painting, crafts or free writing", ru: "Рисование, крафт или письмо" },
        { emoji: "📖", en: "Cozy reading evening, no screens", ru: "Вечер за чтением в тишине" },
      ],
    },
  ],
};
