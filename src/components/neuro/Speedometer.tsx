import { motion } from "framer-motion";
import { STATES, stateColor, type StateId } from "@/lib/neuro";

const R = 132;
const CX = 160;
const CY = 158;
const START = -180;
const SWEEP = 180;
const SEG = SWEEP / STATES.length;

function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
}

function arcPath(from: number, to: number, radius: number) {
  const p1 = polar(from, radius);
  const p2 = polar(to, radius);
  return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 1 ${p2.x} ${p2.y}`;
}

export function Speedometer({
  value,
  onChange,
}: {
  value: StateId | null;
  onChange: (s: StateId) => void;
}) {
  const index = value ? STATES.findIndex((s) => s.id === value) : -1;
  const needleAngle = index >= 0 ? START + SEG * (index + 0.5) : START + SWEEP / 2;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 320 190" className="w-full max-w-[420px]">
        {STATES.map((s, i) => {
          const from = START + i * SEG + 1.2;
          const to = START + (i + 1) * SEG - 1.2;
          const active = s.id === value;
          return (
            <path
              key={s.id}
              d={arcPath(from, to, R)}
              stroke={stateColor(s.id)}
              strokeWidth={active ? 26 : 16}
              strokeLinecap="round"
              fill="none"
              opacity={value && !active ? 0.35 : 1}
              className="cursor-pointer transition-all duration-300"
              onClick={() => onChange(s.id)}
            />
          );
        })}

        <motion.g
          animate={{ rotate: needleAngle + 90 }}
          initial={false}
          transition={{ type: "spring", stiffness: 90, damping: 13 }}
          style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }}
        >

          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - R + 26}
            stroke="var(--foreground)"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </motion.g>
        <circle cx={CX} cy={CY} r={11} fill="var(--card)" stroke="var(--border)" strokeWidth={2} />
        <circle
          cx={CX}
          cy={CY}
          r={5}
          fill={value ? stateColor(value) : "var(--muted-foreground)"}
        />
      </svg>

      <div className="-mt-2 grid w-full grid-cols-4 gap-1.5 sm:grid-cols-7">
        {STATES.map((s) => {
          const active = s.id === value;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className="group relative rounded-lg border px-1.5 py-2 text-center transition-all"
              style={{
                borderColor: active ? stateColor(s.id) : "var(--border)",
                background: active
                  ? `color-mix(in oklab, ${stateColor(s.id)} 14%, transparent)`
                  : "transparent",
              }}
            >
              <span
                className="mx-auto mb-1 block size-2 rounded-full"
                style={{ background: stateColor(s.id) }}
              />
              <span className="block text-[11px] leading-tight font-medium">{s.label}</span>
              <span className="block text-[10px] leading-tight text-muted-foreground">{s.ru}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
