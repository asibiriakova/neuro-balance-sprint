import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Snowflake, Wind, Waves, Leaf, NotebookPen, Play, Pause, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

function useTimer(seconds: number) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);

  return {
    left,
    running,
    toggle: () => setRunning((r) => !r),
    reset: () => {
      setRunning(false);
      setLeft(seconds);
    },
  };
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function PracticeCard({
  icon,
  title,
  desc,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-lg"
          style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

function TimerRow({ seconds, color }: { seconds: number; color: string }) {
  const t = useTimer(seconds);
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-xl tabular-nums" style={{ color }}>
        {fmt(t.left)}
      </span>
      <Button size="sm" variant="secondary" onClick={t.toggle}>
        {t.running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        {t.running ? "Pause" : "Start"}
      </Button>
      <Button size="sm" variant="ghost" onClick={t.reset}>
        <RotateCcw className="size-3.5" />
      </Button>
    </div>
  );
}

function BreathCircle() {
  const phases = [
    { label: "Inhale", d: 2.5, scale: 1.15 },
    { label: "Second sip in", d: 1, scale: 1.35 },
    { label: "Long exhale", d: 6, scale: 0.75 },
  ];
  const [i, setI] = useState(0);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setI((p) => (p + 1) % phases.length), phases[i]!.d * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, on]);

  const phase = phases[i]!;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative grid size-40 place-items-center">
        <span
          className="pulse-ring absolute size-28 rounded-full"
          style={{ background: "color-mix(in oklab, var(--state-panic) 22%, transparent)" }}
        />
        <motion.div
          animate={{ scale: on ? phase.scale : 1 }}
          transition={{ duration: on ? phase.d : 0.4, ease: "easeInOut" }}
          className="grid size-28 place-items-center rounded-full text-xs font-medium text-primary-foreground"
          style={{
            background:
              "linear-gradient(140deg, var(--state-overarousal), var(--state-panic))",
          }}
        >
          {on ? phase.label : "Ready"}
        </motion.div>
      </div>
      <Button size="sm" variant={on ? "secondary" : "default"} onClick={() => setOn((v) => !v)}>
        {on ? "Stop" : "Begin physiological sigh"}
      </Button>
    </div>
  );
}

const GROUNDING = [
  "5 things you can see",
  "4 things you can feel",
  "3 things you can hear",
  "2 things you can smell",
  "1 thing you can taste",
];

function Grounding() {
  const [done, setDone] = useState<number[]>([]);
  return (
    <ul className="space-y-2">
      {GROUNDING.map((g, idx) => (
        <li key={g} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={done.includes(idx)}
            onCheckedChange={() =>
              setDone((d) => (d.includes(idx) ? d.filter((x) => x !== idx) : [...d, idx]))
            }
          />
          <span className={done.includes(idx) ? "text-muted-foreground line-through" : ""}>{g}</span>
        </li>
      ))}
    </ul>
  );
}

function BrainDump() {
  const [text, setText] = useState("");
  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Empty the loop. Nothing here is kept unless you archive it."
      />
      <div className="flex gap-2">
        <Button size="sm" variant="destructive" onClick={() => setText("")}>
          <Flame className="size-3.5" /> Burn
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setText("")}>
          Archive
        </Button>
      </div>
    </div>
  );
}

export function SosModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Somatic SOS</DialogTitle>
          <DialogDescription>
            Down-regulate the body first. Cognition returns once the nervous system settles.
          </DialogDescription>
        </DialogHeader>
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Tabs defaultValue="distress">
              <TabsList className="w-full">
                <TabsTrigger value="distress" className="flex-1">
                  Distress / Panic reset
                </TabsTrigger>
                <TabsTrigger value="burnout" className="flex-1">
                  Burnout / Freeze reset
                </TabsTrigger>
              </TabsList>

              <TabsContent value="distress" className="mt-4 space-y-3">
                <PracticeCard
                  icon={<Wind className="size-4" />}
                  title="Physiological sigh · 2 min"
                  desc="Double inhale through the nose, long slow exhale through the mouth."
                  color="var(--state-panic)"
                >
                  <BreathCircle />
                </PracticeCard>
                <PracticeCard
                  icon={<Waves className="size-4" />}
                  title="5-4-3-2-1 sensory grounding"
                  desc="Move attention outward, step by step."
                  color="var(--state-overarousal)"
                >
                  <Grounding />
                </PracticeCard>
                <PracticeCard
                  icon={<Snowflake className="size-4" />}
                  title="Cold vagus stimulation · 1 min"
                  desc="Cold water on wrists and face, or a cool pack on the side of the neck."
                  color="var(--state-passivity)"
                >
                  <TimerRow seconds={60} color="var(--state-passivity)" />
                </PracticeCard>
              </TabsContent>

              <TabsContent value="burnout" className="mt-4 space-y-3">
                <PracticeCard
                  icon={<Waves className="size-4" />}
                  title="Somatic shaking · 3 min"
                  desc="Loose knees, shake hands and shoulders to discharge freeze."
                  color="var(--state-apathy)"
                >
                  <TimerRow seconds={180} color="var(--state-apathy)" />
                </PracticeCard>
                <PracticeCard
                  icon={<Leaf className="size-4" />}
                  title="Sensory tea / interoception · 5 min"
                  desc="One warm cup. Track temperature, smell, and the pause between sips."
                  color="var(--state-relaxation)"
                >
                  <TimerRow seconds={300} color="var(--state-relaxation)" />
                </PracticeCard>
                <PracticeCard
                  icon={<NotebookPen className="size-4" />}
                  title="Brain dump"
                  desc="Distraction-free scratchpad. Burn it or archive it."
                  color="var(--state-balance)"
                >
                  <BrainDump />
                </PracticeCard>
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
