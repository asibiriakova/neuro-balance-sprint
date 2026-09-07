import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SprintProvider, useSprint } from "./sprint-store";
import type { NewTaskInput, SprintData, SprintService } from "@/services";
import type { StateId } from "./neuro";

function makeSprintData(overrides: Partial<SprintData> = {}): SprintData {
  return {
    sprintNumber: 1,
    day: 3,
    tasks: [{ id: "t1", title: "Task one", hours: 2, pillar: "foundation", done: false }],
    logs: [
      { day: 1, state: null },
      { day: 2, state: null },
      { day: 3, state: null },
    ],
    priorities: [],
    gratitude: "",
    committed: false,
    archive: [],
    ...overrides,
  };
}

/** Minimal in-memory SprintService so the store's wiring is tested in isolation. */
class FakeSprintService implements SprintService {
  constructor(private data: SprintData = makeSprintData()) {}

  async getSprint(): Promise<SprintData> {
    return this.data;
  }
  async setTodayState(state: StateId): Promise<SprintData> {
    this.data = {
      ...this.data,
      logs: this.data.logs.map((l) => (l.day === this.data.day ? { ...l, state } : l)),
    };
    return this.data;
  }
  async toggleTask(taskId: string): Promise<SprintData> {
    this.data = {
      ...this.data,
      tasks: this.data.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    };
    return this.data;
  }
  async addTask(task: NewTaskInput): Promise<SprintData> {
    this.data = { ...this.data, tasks: [...this.data.tasks, { ...task, id: "new", done: false }] };
    return this.data;
  }
  async togglePriority(taskId: string): Promise<SprintData> {
    const has = this.data.priorities.includes(taskId);
    this.data = {
      ...this.data,
      priorities: has
        ? this.data.priorities.filter((p) => p !== taskId)
        : [...this.data.priorities, taskId],
    };
    return this.data;
  }
  async setGratitude(value: string): Promise<SprintData> {
    this.data = { ...this.data, gratitude: value };
    return this.data;
  }
}

function Probe() {
  const { day, tasks, gratitude, toggleTask, setGratitude, hoursByPillar } = useSprint();
  return (
    <div>
      <span data-testid="day">{day}</span>
      <span data-testid="hours">{hoursByPillar.foundation}</span>
      <span data-testid="gratitude">{gratitude}</span>
      {tasks.map((t) => (
        <button key={t.id} onClick={() => toggleTask(t.id)}>
          {t.title}: {t.done ? "done" : "open"}
        </button>
      ))}
      <button onClick={() => setGratitude("Golden hour walk")}>save gratitude</button>
    </div>
  );
}

describe("SprintProvider / useSprint", () => {
  it("throws when used outside a provider", () => {
    // Suppress the expected React error-boundary console output for this assertion.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/useSprint must be used inside SprintProvider/);
    spy.mockRestore();
  });

  it("loads sprint data from the injected service and derives hoursByPillar", async () => {
    render(
      <SprintProvider service={new FakeSprintService()}>
        <Probe />
      </SprintProvider>,
    );

    expect(await screen.findByTestId("day")).toHaveTextContent("3");
    expect(screen.getByTestId("hours")).toHaveTextContent("2");
    expect(screen.getByText("Task one: open")).toBeInTheDocument();
  });

  it("round-trips a mutation through the service and re-renders with the result", async () => {
    const user = userEvent.setup();
    render(
      <SprintProvider service={new FakeSprintService()}>
        <Probe />
      </SprintProvider>,
    );

    const toggle = await screen.findByText("Task one: open");
    await user.click(toggle);

    await waitFor(() => expect(screen.getByText("Task one: done")).toBeInTheDocument());
  });

  it("saves gratitude via the service", async () => {
    const user = userEvent.setup();
    render(
      <SprintProvider service={new FakeSprintService()}>
        <Probe />
      </SprintProvider>,
    );

    await screen.findByTestId("day");
    await user.click(screen.getByText("save gratitude"));

    await waitFor(() =>
      expect(screen.getByTestId("gratitude")).toHaveTextContent("Golden hour walk"),
    );
  });

  it("renders nothing until the service resolves", async () => {
    let resolve!: (d: SprintData) => void;
    const pending: SprintService = {
      getSprint: () => new Promise((r) => (resolve = r)),
      setTodayState: async (s) => makeSprintData({ logs: [{ day: 1, state: s }] }),
      toggleTask: async () => makeSprintData(),
      addTask: async () => makeSprintData(),
      togglePriority: async () => makeSprintData(),
      setGratitude: async () => makeSprintData(),
    };

    const { container } = render(
      <SprintProvider service={pending}>
        <Probe />
      </SprintProvider>,
    );

    expect(container).toBeEmptyDOMElement();

    await act(async () => {
      resolve(makeSprintData());
    });

    expect(await screen.findByTestId("day")).toBeInTheDocument();
  });
});
