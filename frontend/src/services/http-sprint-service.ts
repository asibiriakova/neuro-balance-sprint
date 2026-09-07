import type { StateId } from "@/lib/neuro";
import { apiRequest } from "./http-client";
import type { NewTaskInput, SprintData, SprintService } from "./sprint-service";

/**
 * HTTP-backed SprintService, calling the FastAPI backend under `../backend`
 * per `openapi.yaml`'s `/sprints/current*` routes. Same interface as
 * `MockSprintService`, so it's a drop-in replacement — see services/index.ts.
 */
export class HttpSprintService implements SprintService {
  async getSprint(): Promise<SprintData> {
    return apiRequest<SprintData>("/sprints/current");
  }

  async setTodayState(state: StateId): Promise<SprintData> {
    return apiRequest<SprintData>("/sprints/current/state", {
      method: "POST",
      body: JSON.stringify({ state }),
    });
  }

  async toggleTask(taskId: string): Promise<SprintData> {
    return apiRequest<SprintData>(
      `/sprints/current/tasks/${encodeURIComponent(taskId)}/toggle-done`,
      { method: "PATCH" },
    );
  }

  async addTask(task: NewTaskInput): Promise<SprintData> {
    return apiRequest<SprintData>("/sprints/current/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  }

  async togglePriority(taskId: string): Promise<SprintData> {
    return apiRequest<SprintData>(
      `/sprints/current/tasks/${encodeURIComponent(taskId)}/toggle-priority`,
      { method: "PATCH" },
    );
  }

  async setGratitude(value: string): Promise<SprintData> {
    return apiRequest<SprintData>("/sprints/current/gratitude", {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  }
}

/** The service instance the app uses today, backed by the real FastAPI backend. */
export const httpSprintService: SprintService = new HttpSprintService();
