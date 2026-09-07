import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/neuro/AppShell";
import { Speedometer } from "@/components/neuro/Speedometer";
import { Heatmap } from "@/components/neuro/Heatmap";
import { TimeGauge } from "@/components/neuro/TimeGauge";
import { SprintProvider, useSprint } from "@/lib/sprint-store";
import { PILLARS, PILLAR_CAP, SPRINT_CAP, STATES, ZONES, stateColor } from "@/lib/neuro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuroSprint — Daily Neural Regulation Hub" },
      {
        name: "description",
        content:
          "Track your 7-state NeuroBalance scale, top 3 priorities and tri-pillar sprint budget in one calm daily hub.",
      },
      { property: "og:title", content: "NeuroSprint — Daily Neural Regulation Hub" },
      {
        property: "og:description",
        content: "A 1-minute daily standup for your nervous system and your 21-day sprint.",
      },
    ],
  }),
  component: () => (
    <SprintProvider>
      <AppShell>
        <Dashboard />
      </AppShell>
    </SprintProvider>
  ),
});

function Dashboard() {
  const {
    todayState,
    setTodayState,
    logs,
    day,
    tasks,
    priorities,
    togglePriority,
    toggleTask,
    gratitude,
    setGratitude,
    hoursByPillar,
  } = useSprint();
  const [note, setNote] = useState(gratitude);

  const zone = todayState ? STATES.find((s) => s.id === todayState)!.zone : null;
  const totalHours = Object.values(hoursByPillar).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Standup */}
      <section className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="font-display text-lg font-semibold">1-Minute Daily Standup</h1>
          <span className="text-xs text-muted-foreground">Day {day} · 21-day sprint</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <Speedometer
              value={todayState}
              onChange={(s) => {
                setTodayState(s);
                const z = STATES.find((x) => x.id === s)!.zone;
                if (z !== "integration") toast("Off-window state logged — try an SOS practice.");
              }}
            />
          </div>

        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">
              Top 3 priorities of the day{" "}
              <span className="text-muted-foreground">({priorities.length}/3)</span>
            </p>
            <ul className="space-y-1.5">
              {tasks.slice(0, 7).map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={priorities.includes(t.id)}
                    onCheckedChange={() => togglePriority(t.id)}
                  />
                  <span className={priorities.includes(t.id) ? "font-medium" : ""}>{t.title}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{t.hours}h</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="size-3.5" style={{ color: stateColor("engagement") }} />
              Remarkable moment of the last 24 hours
            </p>
            <div className="flex gap-2">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="One sentence is enough…"
              />
              <Button
                onClick={() => {
                  setGratitude(note);
                  toast.success("Positivity anchor saved");
                }}
              >
                Save
              </Button>
            </div>
            <AnimatePresence>
              {gratitude ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-xs text-muted-foreground"
                >
                  Anchored: “{gratitude}”
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-3 font-display text-base font-semibold">21-Day NeuroBalance Heatmap</h2>
          <Heatmap logs={logs} currentDay={day} />
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-base font-semibold">Time Budget</h2>
            <span
              className="text-xs"
              style={{
                color: totalHours > SPRINT_CAP ? stateColor("panic") : "var(--muted-foreground)",
              }}
            >
              {totalHours}h / {SPRINT_CAP}h
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PILLARS.map((p, i) => (
              <TimeGauge
                key={p.id}
                label={p.label}
                sub={p.ru}
                hours={hoursByPillar[p.id]}
                cap={PILLAR_CAP}
                color={stateColor(
                  i === 0 ? "relaxation" : i === 1 ? "engagement" : "balance",
                )}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Kanban */}
      <section className="grid gap-4 md:grid-cols-3">
        {PILLARS.map((p) => {
          const list = tasks.filter((t) => t.pillar === p.id);
          const hrs = hoursByPillar[p.id];
          return (
            <div key={p.id} className="glass rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-display text-sm font-semibold">
                    {p.icon} {p.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.ru} · {p.blurb}
                  </p>
                </div>
                <span
                  className="rounded-full border px-2 py-0.5 text-[11px]"
                  style={{
                    color: hrs > PILLAR_CAP ? stateColor("panic") : "var(--muted-foreground)",
                    borderColor:
                      hrs > PILLAR_CAP
                        ? stateColor("panic")
                        : "var(--border)",
                  }}
                >
                  {hrs}/{PILLAR_CAP}h
                </span>
              </div>
              <ul className="space-y-2">
                {list.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 rounded-xl border bg-card/60 px-3 py-2 text-sm"
                  >
                    <Checkbox checked={t.done} onCheckedChange={() => toggleTask(t.id)} />
                    <span className={t.done ? "text-muted-foreground line-through" : ""}>
                      {t.title}
                    </span>
                    <span className="ml-auto text-[11px] text-muted-foreground">{t.hours}h</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
