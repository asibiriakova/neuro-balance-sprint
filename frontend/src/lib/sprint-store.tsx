import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sprintService } from "@/services";
import type { NewTaskInput, SprintData, SprintService } from "@/services";
import type { PillarId, StateId } from "./neuro";

interface Ctx extends SprintData {
  todayState: StateId | null;
  setTodayState: (s: StateId) => void;
  toggleTask: (id: string) => void;
  addTask: (t: NewTaskInput) => void;
  togglePriority: (id: string) => void;
  setGratitude: (v: string) => void;
  hoursByPillar: Record<PillarId, number>;
}

const SprintContext = createContext<Ctx | null>(null);

export function SprintProvider({
  children,
  service = sprintService,
}: {
  children: ReactNode;
  /** Overridable for tests; defaults to the app's real (mock) service. */
  service?: SprintService;
}) {
  const [data, setData] = useState<SprintData | null>(null);

  useEffect(() => {
    let cancelled = false;
    service.getSprint().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [service]);

  const value = useMemo<Ctx | null>(() => {
    if (!data) return null;

    const hoursByPillar = data.tasks.reduce(
      (acc, t) => {
        acc[t.pillar] += t.hours;
        return acc;
      },
      { foundation: 0, drive: 0, joy: 0 } as Record<PillarId, number>,
    );

    return {
      ...data,
      hoursByPillar,
      todayState: data.logs.find((l) => l.day === data.day)?.state ?? null,
      setTodayState: (s) => {
        service.setTodayState(s).then(setData);
      },
      toggleTask: (id) => {
        service.toggleTask(id).then(setData);
      },
      addTask: (t) => {
        service.addTask(t).then(setData);
      },
      togglePriority: (id) => {
        service.togglePriority(id).then(setData);
      },
      setGratitude: (v) => {
        service.setGratitude(v).then(setData);
      },
    };
  }, [data, service]);

  if (!value) return null;

  return <SprintContext.Provider value={value}>{children}</SprintContext.Provider>;
}

export function useSprint() {
  const ctx = useContext(SprintContext);
  if (!ctx) throw new Error("useSprint must be used inside SprintProvider");
  return ctx;
}
