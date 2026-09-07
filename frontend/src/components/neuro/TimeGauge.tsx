import { motion } from "framer-motion";

export function TimeGauge({
  label,
  sub,
  hours,
  cap,
  color,
}: {
  label: string;
  sub: string;
  hours: number;
  cap: number;
  color: string;
}) {
  const pct = Math.min(hours / cap, 1);
  const over = hours > cap;
  const r = 42;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg viewBox="0 0 110 110" className="size-28 -rotate-90">
          <circle cx="55" cy="55" r={r} fill="none" stroke="var(--muted)" strokeWidth="9" />
          <motion.circle
            cx="55"
            cy="55"
            r={r}
            fill="none"
            stroke={over ? "var(--state-panic)" : color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ type: "spring", stiffness: 60, damping: 16 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-lg font-semibold">{hours}h</span>
          <span className="text-[10px] text-muted-foreground">of {cap}h</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
