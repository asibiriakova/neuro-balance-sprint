import { STATES, stateColor, type DayLog } from "@/lib/neuro";

export function Heatmap({ logs, currentDay }: { logs: DayLog[]; currentDay: number }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {logs.map((l) => (
          <div
            key={l.day}
            title={l.state ? `Day ${l.day} · ${l.state}` : `Day ${l.day} · not logged`}
            className="relative aspect-square rounded-lg border text-[10px] transition-transform hover:scale-[1.06]"
            style={{
              background: l.state
                ? `color-mix(in oklab, ${stateColor(l.state)} 78%, transparent)`
                : "var(--muted)",
              borderColor: l.day === currentDay ? "var(--foreground)" : "transparent",
            }}
          >
            <span className="absolute top-1 left-1.5 font-medium text-foreground/55">{l.day}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {STATES.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: stateColor(s.id) }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
