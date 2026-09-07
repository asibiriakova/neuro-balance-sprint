import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, LifeBuoy } from "lucide-react";
import { SosModal } from "./SosModal";
import { useSprint } from "@/lib/sprint-store";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/planning", label: "Planning Canvas" },
  { to: "/reflection", label: "Archive" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [sos, setSos] = useState(false);
  const { sprintNumber, day } = useSprint();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-4" />
            </span>
            <span className="font-display text-sm font-semibold tracking-tight">NeuroSprint</span>
          </Link>

          <span className="hidden rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground sm:inline">
            Sprint #{sprintNumber}: Day {day} of 21
          </span>

          <nav className="ml-auto flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <span
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
            style={{
              borderColor: "color-mix(in oklab, var(--state-balance) 45%, transparent)",
              color: "var(--state-balance)",
            }}
          >
            <CheckCircle2 className="size-3" />
            <span className="hidden md:inline">Reminders synced</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

      <div className="fixed right-5 bottom-5 z-50">
        <span
          className="pulse-ring absolute inset-0 rounded-full"
          style={{ background: "color-mix(in oklab, var(--state-panic) 30%, transparent)" }}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSos(true)}
          className="relative flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg"
          style={{
            background: "linear-gradient(140deg, var(--state-overarousal), var(--state-panic))",
          }}
        >
          <LifeBuoy className="size-4" />
          SOS / Reset
        </motion.button>
      </div>

      <SosModal open={sos} onOpenChange={setSos} />
    </div>
  );
}
