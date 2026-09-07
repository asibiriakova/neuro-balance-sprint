import { beforeEach, describe, expect, it } from "vitest";
import { MockSprintService } from "./mock-sprint-service";

/** In-memory Storage stand-in so tests never touch real localStorage/jsdom quirks. */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
}

describe("MockSprintService", () => {
  let storage: Storage;
  let service: MockSprintService;

  beforeEach(() => {
    storage = createMemoryStorage();
    service = new MockSprintService("test:key", storage);
  });

  it("returns seeded sprint data on first load", async () => {
    const sprint = await service.getSprint();
    expect(sprint.sprintNumber).toBe(1);
    expect(sprint.day).toBe(8);
    expect(sprint.tasks.length).toBeGreaterThan(0);
    expect(sprint.archive.length).toBe(2);
  });

  it("persists writes to storage and rehydrates a fresh instance from them", async () => {
    await service.addTask({ title: "New habit", hours: 1, pillar: "foundation" });

    const rehydrated = new MockSprintService("test:key", storage);
    const sprint = await rehydrated.getSprint();
    expect(sprint.tasks.some((t) => t.title === "New habit")).toBe(true);
  });

  it("falls back to seed data when stored JSON is corrupt", async () => {
    storage.setItem("test:key", "{not json");
    const sprint = await service.getSprint();
    expect(sprint.sprintNumber).toBe(1);
  });

  describe("setTodayState", () => {
    it("sets the state on the log entry for the current day only, leaving other days untouched", async () => {
      const before = await service.getSprint();
      const after = await service.setTodayState("panic");

      const today = after.logs.find((l) => l.day === after.day);
      expect(today?.state).toBe("panic");

      const otherDaysBefore = before.logs.filter((l) => l.day !== before.day);
      const otherDaysAfter = after.logs.filter((l) => l.day !== after.day);
      expect(otherDaysAfter).toEqual(otherDaysBefore);
    });
  });

  describe("toggleTask", () => {
    it("flips a task's done flag and flips it back", async () => {
      const initial = await service.getSprint();
      const task = initial.tasks[0]!;

      const toggled = await service.toggleTask(task.id);
      expect(toggled.tasks.find((t) => t.id === task.id)?.done).toBe(!task.done);

      const toggledBack = await service.toggleTask(task.id);
      expect(toggledBack.tasks.find((t) => t.id === task.id)?.done).toBe(task.done);
    });

    it("leaves other tasks untouched", async () => {
      const initial = await service.getSprint();
      const [first, second] = initial.tasks;
      await service.toggleTask(first!.id);
      const after = await service.getSprint();
      expect(after.tasks.find((t) => t.id === second!.id)?.done).toBe(second!.done);
    });
  });

  describe("addTask", () => {
    it("appends a new, incomplete task with a generated id", async () => {
      const before = await service.getSprint();
      const after = await service.addTask({
        title: "Cold plunge",
        hours: 0.5,
        pillar: "foundation",
      });

      expect(after.tasks.length).toBe(before.tasks.length + 1);
      const added = after.tasks.at(-1)!;
      expect(added).toMatchObject({
        title: "Cold plunge",
        hours: 0.5,
        pillar: "foundation",
        done: false,
      });
      expect(added.id).toBeTruthy();
    });
  });

  describe("togglePriority", () => {
    it("adds a task id to priorities", async () => {
      const sprint = await service.togglePriority("task-1");
      expect(sprint.priorities).toContain("task-1");
    });

    it("removes a task id already in priorities", async () => {
      await service.togglePriority("task-1");
      const sprint = await service.togglePriority("task-1");
      expect(sprint.priorities).not.toContain("task-1");
    });

    it("caps priorities at 3 and ignores a 4th", async () => {
      await service.togglePriority("task-1");
      await service.togglePriority("task-2");
      await service.togglePriority("task-3");
      const sprint = await service.togglePriority("task-4");

      expect(sprint.priorities).toEqual(["task-1", "task-2", "task-3"]);
    });
  });

  describe("setGratitude", () => {
    it("stores the gratitude note", async () => {
      const sprint = await service.setGratitude("Sunset run with no phone");
      expect(sprint.gratitude).toBe("Sunset run with no phone");
    });
  });
});
