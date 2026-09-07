import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, TriangleAlert, Check, Sparkles } from "lucide-react";
import { AppShell } from "@/components/neuro/AppShell";
import { SprintProvider, useSprint } from "@/lib/sprint-store";
import { PILLARS, PILLAR_CAP, SPRINT_CAP, stateColor, uid, type PillarId } from "@/lib/neuro";
import {
  BUDGET_PRESETS,
  IDEA_BANK,
  presetTasks,
  WEEKDAYS,
  WEEKEND_BLOCKS,
} from "@/lib/neuro-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "Sprint Planning Canvas — NeuroSprint" },
      {
        name: "description",
        content:
          "Decompose monthly goals into micro-tasks with an AI assistant and commit a balanced 30-hour sprint.",
      },
      { property: "og:title", content: "Sprint Planning Canvas — NeuroSprint" },
      {
        property: "og:description",
        content: "Split-screen studio: brainstorm on the left, commit a balanced sprint on the right.",
      },
    ],
  }),
  component: () => (
    <SprintProvider>
      <AppShell>
        <Planning />
      </AppShell>
    </SprintProvider>
  ),
});

interface Msg {
  id: string;
  role: "user" | "ai";
  text: string;
  suggestions?: { title: string; hours: number; pillar: PillarId }[];
}

const CHIPS = [
  "Decompose my fitness goal",
  "Suggest 10h Drive backlog",
  "Balance my cognitive load",
];

function respond(prompt: string): Msg {
  const p = prompt.toLowerCase();
  if (p.includes("fitness") || p.includes("health"))
    return {
      id: uid(),
      role: "ai",
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
      role: "ai",
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
      role: "ai",
      text: "Your Drive column carries the highest cognitive cost. Add sensory recovery so the prefrontal cortex stays online:",
      suggestions: [
        { title: "Screen-free walk after deep work", hours: 2, pillar: "joy" },
        { title: "Sensory recovery: sauna or bath", hours: 2, pillar: "joy" },
        { title: "Protected 8h sleep window", hours: 3, pillar: "foundation" },
      ],
    };
  return {
    id: uid(),
    role: "ai",
    text: "Let's decompose that. Here are three micro-tasks sized for a 21-day sprint:",
    suggestions: [
      { title: `${prompt.slice(0, 38)} — first visible step`, hours: 2, pillar: "drive" },
      { title: `${prompt.slice(0, 38)} — recurring practice`, hours: 3, pillar: "foundation" },
      { title: `${prompt.slice(0, 38)} — celebrate progress`, hours: 1, pillar: "joy" },
    ],
  };
}

function IdeaBank({
  pillar,
  onAdd,
}: {
  pillar: PillarId;
  onAdd: (t: { title: string; hours: number; pillar: PillarId }) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" className="mt-2 h-7 w-full text-[11px]">
          <Sparkles className="size-3" />
          Idea bank
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-80 w-80 overflow-y-auto p-3">
        <p className="text-xs font-semibold">
          {PILLARS.find((p) => p.id === pillar)!.icon} Quick-add templates
        </p>
        {IDEA_BANK[pillar].map((g) => (
          <div key={g.label} className="mt-3">
            <p className="text-[11px] font-medium text-muted-foreground">{g.label}</p>
            <ul className="mt-1 space-y-1">
              {g.items.map((it) => (
                <li key={it.en}>
                  <button
                    onClick={() => {
                      onAdd({
                        title: `${it.emoji} ${it.en}`,
                        hours: Math.round((g.minutes / 60) * 10) / 10,
                        pillar,
                      });
                      toast.success(`Added: ${it.en}`);
                    }}
                    className="flex w-full items-start gap-2 rounded-lg border bg-card px-2 py-1.5 text-left text-[11px] transition-colors hover:bg-secondary"
                  >
                    <span>{it.emoji}</span>
                    <span className="flex-1">
                      {it.en}
                      <span className="block text-[10px] text-muted-foreground">{it.ru}</span>
                    </span>
                    <Plus className="size-3 shrink-0 opacity-60" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function Planning() {
  const { tasks, addTask, hoursByPillar } = useSprint();
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: uid(),
      role: "ai",
      text: "What is the big goal for this 21-day sprint? I'll decompose it into Foundation, Drive and Joy micro-tasks.",
    },
  ]);
  const [input, setInput] = useState("");
  const [committed, setCommitted] = useState(false);
  const [preset, setPreset] = useState<string | null>(null);

  const total = Object.values(hoursByPillar).reduce((a, b) => a + b, 0);
  const overPillar = PILLARS.filter((p) => hoursByPillar[p.id] > PILLAR_CAP);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: uid(), role: "user", text }, respond(text)]);
    setInput("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[40fr_60fr]">
      {/* Left: assistant */}
      <div className="glass flex h-[75vh] flex-col rounded-2xl p-4">
        <h1 className="font-display text-base font-semibold">AI Planning Assistant</h1>
        <p className="text-xs text-muted-foreground">Decompose monthly goals into micro-tasks.</p>

        <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
          {msgs.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div
                className={`max-w-[92%] rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "border bg-card"
                }`}
              >
                {m.text}
              </div>
              {m.suggestions ? (
                <div className="mt-2 space-y-1.5">
                  {m.suggestions.map((s) => (
                    <div
                      key={s.title}
                      className="flex items-center gap-2 rounded-lg border bg-card/70 px-3 py-2 text-xs"
                    >
                      <span className="flex-1">{s.title}</span>
                      <span className="text-muted-foreground">{s.hours}h</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          addTask(s);
                          toast.success(`Added to ${s.pillar}`);
                        }}
                      >
                        <Plus className="size-3" />
                        {PILLARS.find((p) => p.id === s.pillar)!.label}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </motion.div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => send(c)}
              className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {c}
            </button>
          ))}
        </div>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your monthly goal…"
          />
          <Button type="submit" size="icon">
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      {/* Right: canvas */}
      <div className="glass flex h-[75vh] flex-col rounded-2xl p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-base font-semibold">Interactive Sprint Canvas</h2>
          <span
            className="text-xs font-medium"
            style={{ color: total > SPRINT_CAP ? stateColor("panic") : stateColor("balance") }}
          >
            {total}h / {SPRINT_CAP}h
          </span>
        </div>

        <AnimatePresence>
          {(total > SPRINT_CAP || overPillar.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{
                background: `color-mix(in oklab, ${stateColor("overarousal")} 14%, transparent)`,
                color: stateColor("panic"),
              }}
            >
              <TriangleAlert className="size-3.5" />
              {overPillar.length
                ? `${overPillar.map((p) => p.label).join(", ")} over the 10h cap.`
                : `Sprint exceeds the ${SPRINT_CAP}h budget.`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time-budgeting switcher */}
        <div className="mt-3 rounded-xl border bg-card/50 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold">Time-budgeting preset</p>
              <p className="text-[10px] text-muted-foreground">
                {WEEKDAYS} weekdays + {WEEKEND_BLOCKS} weekend blocks per sprint.
              </p>
            </div>
            <Select
              value={preset ?? ""}
              onValueChange={(id) => {
                const p = BUDGET_PRESETS.find((x) => x.id === id);
                if (!p) return;
                setPreset(id);
                presetTasks(p).forEach(addTask);
                toast.success(`${p.name} applied`);
              }}
            >
              <SelectTrigger className="w-52 text-xs">
                <SelectValue placeholder="Choose a preset…" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-muted-foreground">{p.tagline}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {preset && (
            <ul className="mt-2 space-y-0.5 border-t pt-2">
              {(() => {
                const p = BUDGET_PRESETS.find((x) => x.id === preset)!;
                return p.lines.map((l, lineIndex) => (
                  <li key={l.label} className="text-[10px] text-muted-foreground">
                    {l.cadence === "weekday"
                      ? `Mon–Fri · ${l.minutes} min · ${l.label}`
                      : p.id === "a" && lineIndex === 3
                        ? "Saturday · 150 min · Joy weekend block"
                        : p.id === "a" && lineIndex === 4
                          ? "Sunday · 120 min · Foundation weekend block / 30 min · Weekly reflection"
                          : p.id === "b" && lineIndex === 3
                            ? "Saturday · 90 min · Joy weekend block"
                            : p.id === "b" && lineIndex === 4
                              ? "Sunday · 60 min · Foundation weekend block / 30 min · Weekly reflection"
                              : `Weekend · ${l.minutes} min · ${l.label}`}
                  </li>
                ));
              })()}
            </ul>
          )}
        </div>

        <div className="mt-3 grid flex-1 grid-cols-3 gap-3 overflow-y-auto">
          {PILLARS.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card/50 p-2.5">
              <p className="text-xs font-semibold">
                {p.icon} {p.label}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {hoursByPillar[p.id]}/{PILLAR_CAP}h
              </p>
              <IdeaBank pillar={p.id} onAdd={addTask} />
              <ul className="mt-2 space-y-1.5">
                {tasks
                  .filter((t) => t.pillar === p.id)
                  .map((t) => (
                    <li key={t.id} className="rounded-lg border bg-card px-2 py-1.5 text-[11px]">
                      {t.title}
                      <span className="block text-muted-foreground">{t.hours}h</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <Button
          className="mt-3"
          disabled={committed}
          onClick={() => {
            setCommitted(true);
            toast.success("Sprint committed. 21 days start now.");
          }}
        >
          {committed ? <Check className="size-4" /> : null}
          {committed ? "Sprint committed" : "Approve & Commit Sprint"}
        </Button>
      </div>
    </div>
  );
}
