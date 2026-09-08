import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ArchivedSprint, PillarId, StateId } from "./neuro";
import { getService } from "@/services";
import { seedArchive, seedSprint } from "@/services/seed";
import type {
  AssistantReply,
  JoyPassanaConfig,
  ReflectionEntry,
  SprintSnapshot,
} from "@/services/types";

interface Ctx extends SprintSnapshot {
  loading: boolean;
  archive: ArchivedSprint[];
  todayState: StateId | null;
  hoursByPillar: Record<PillarId, number>;
  setTodayState: (s: StateId) => void;
  toggleTask: (id: string) => void;
  addTask: (t: { title: string; hours: number; pillar: PillarId }) => void;
  togglePriority: (id: string) => void;
  setGratitude: (v: string) => void;
  commitSprint: () => Promise<void>;
  saveReflection: (
    entry: Omit<ReflectionEntry, "id" | "createdAt" | "sprintNumber">,
  ) => Promise<void>;
  saveJoyPassana: (config: JoyPassanaConfig) => Promise<void>;
  askAssistant: (prompt: string) => Promise<AssistantReply>;
}

const SprintContext = createContext<Ctx | null>(null);

export function SprintProvider({ children }: { children: ReactNode }) {
  const service = getService();
  const [data, setData] = useState<SprintSnapshot>(() => seedSprint());
  const [archive, setArchive] = useState<ArchivedSprint[]>(() => seedArchive());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [sprint, list] = await Promise.all([service.getSprint(), service.listArchive()]);
      if (!alive) return;
      setData(sprint);
      setArchive(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [service]);

  const value = useMemo<Ctx>(() => {
    const hoursByPillar = data.tasks.reduce(
      (acc, t) => {
        acc[t.pillar] += t.hours;
        return acc;
      },
      { foundation: 0, drive: 0, joy: 0 } as Record<PillarId, number>,
    );

    const run = (p: Promise<SprintSnapshot>) => {
      void p.then(setData);
    };

    return {
      ...data,
      loading,
      archive,
      hoursByPillar,
      todayState: data.logs.find((l) => l.day === data.day)?.state ?? null,
      setTodayState: (s) => run(service.setTodayState(s)),
      toggleTask: (id) => run(service.toggleTask(id)),
      addTask: (t) => run(service.addTask(t)),
      togglePriority: (id) => run(service.togglePriority(id)),
      setGratitude: (v) => run(service.setGratitude(v)),
      commitSprint: async () => setData(await service.commitSprint()),
      saveReflection: async (entry) => {
        await service.saveReflection(entry);
      },
      saveJoyPassana: async (config) => {
        await service.saveJoyPassana(config);
      },
      askAssistant: (prompt) => service.askAssistant(prompt),
    };
  }, [data, archive, loading, service]);

  return <SprintContext.Provider value={value}>{children}</SprintContext.Provider>;
}

export function useSprint() {
  const ctx = useContext(SprintContext);
  if (!ctx) throw new Error("useSprint must be used inside SprintProvider");
  return ctx;
}
