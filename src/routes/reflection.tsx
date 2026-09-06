import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AppShell } from "@/components/neuro/AppShell";
import { SprintProvider, useSprint } from "@/lib/sprint-store";
import { stateById, stateColor } from "@/lib/neuro";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/reflection")({
  head: () => ({
    meta: [
      { title: "Reflection & Archive — NeuroSprint" },
      {
        name: "description",
        content:
          "A guided 4-step transformational reflection, Joy-Passana configurator and the archive of past sprints.",
      },
      { property: "og:title", content: "Reflection & Archive — NeuroSprint" },
      {
        property: "og:description",
        content: "Close the sprint: key change, actions, self-insight, emerging opportunities.",
      },
    ],
  }),
  component: () => (
    <SprintProvider>
      <AppShell>
        <Reflection />
      </AppShell>
    </SprintProvider>
  ),
});

const STEPS = [
  { title: "Key Change Observed", ru: "Главное изменение", hint: "What is measurably different than 21 days ago?" },
  { title: "Actions Taken", ru: "Что я для этого сделал", hint: "Which specific actions produced that change?" },
  { title: "Self-Insight", ru: "Что я понял о себе", hint: "What did your nervous system teach you?" },
  { title: "Emerging Opportunities", ru: "Что теперь возможно для меня", hint: "What is now available that wasn't before?" },
];

const DURATIONS = ["3–4 hours", "1 day", "2 days", "3 days"];
const CHECKLIST = [
  "Silence all notifications",
  "Plan simple meals ahead",
  "Two outdoor walks scheduled",
  "One creative hobby, no output goal",
];

function Reflection() {
  const { archive } = useSprint();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [duration, setDuration] = useState(DURATIONS[1]!);
  const [checked, setChecked] = useState<string[]>([]);
  const done = step === STEPS.length;

  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="font-display text-lg font-semibold">Transformational Reflection</h1>
          <span className="text-xs text-muted-foreground">
            {done ? "Complete" : `Step ${step + 1} of ${STEPS.length}`}
          </span>
        </div>

        <div className="mb-4 flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background:
                  i < step || done ? stateColor("balance") : i === step ? stateColor("engagement") : "var(--muted)",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <p className="font-display text-base font-semibold" style={{ color: stateColor("balance") }}>
                Reflection captured
              </p>
              {STEPS.map((s, i) => (
                <div key={s.title} className="rounded-xl border bg-card/60 p-3">
                  <p className="text-xs font-medium">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{answers[i] || "—"}</p>
                </div>
              ))}
              <Button variant="secondary" onClick={() => setStep(0)}>
                Edit again
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-display text-base font-semibold">{STEPS[step]!.title}</p>
              <p className="text-xs text-muted-foreground">{STEPS[step]!.ru}</p>
              <Textarea
                className="mt-3"
                rows={5}
                placeholder={STEPS[step]!.hint}
                value={answers[step]}
                onChange={(e) =>
                  setAnswers((a) => a.map((v, i) => (i === step ? e.target.value : v)))
                }
              />
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button
                  onClick={() => {
                    setStep((s) => s + 1);
                    if (step === STEPS.length - 1) toast.success("Sprint reflection saved");
                  }}
                >
                  {step === STEPS.length - 1 ? "Finish" : "Next"} <ArrowRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold">Joy-Passana · Week 4 Configurator</h2>
        <p className="text-xs text-muted-foreground">
          Deliberate deceleration after the sprint. Choose the depth of your reset.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className="rounded-full border px-3 py-1.5 text-xs transition-colors"
              style={{
                borderColor: duration === d ? stateColor("relaxation") : "var(--border)",
                background:
                  duration === d
                    ? `color-mix(in oklab, ${stateColor("relaxation")} 14%, transparent)`
                    : "transparent",
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {CHECKLIST.map((c) => (
            <li key={c} className="flex items-center gap-2 rounded-xl border bg-card/60 px-3 py-2 text-sm">
              <Checkbox
                checked={checked.includes(c)}
                onCheckedChange={() =>
                  setChecked((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))
                }
              />
              <span className={checked.includes(c) ? "text-muted-foreground line-through" : ""}>{c}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="size-3.5" /> {checked.length}/{CHECKLIST.length} pre-flight items ready for{" "}
          {duration}.
        </p>
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="mb-3 font-display text-base font-semibold">Sprint Archive</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Sprint</th>
                <th className="pb-2 font-medium">Dates</th>
                <th className="pb-2 font-medium">Dominant state</th>
                <th className="pb-2 font-medium">Completion</th>
                <th className="pb-2 font-medium">Insight</th>
              </tr>
            </thead>
            <tbody>
              {archive.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="py-3 pr-3 font-medium">{a.name}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{a.range}</td>
                  <td className="py-3 pr-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                      style={{
                        background: `color-mix(in oklab, ${stateColor(a.dominant)} 16%, transparent)`,
                        color: stateColor(a.dominant),
                      }}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: stateColor(a.dominant) }} />
                      {stateById(a.dominant).label}
                    </span>
                  </td>
                  <td className="py-3 pr-3">{a.completion}%</td>
                  <td className="max-w-sm py-3 text-muted-foreground">{a.insight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
