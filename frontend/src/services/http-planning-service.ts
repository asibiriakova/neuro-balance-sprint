import { apiRequest } from "./http-client";
import type { PlanningReply, PlanningService } from "./planning-service";

/**
 * HTTP-backed PlanningService, calling the FastAPI backend's
 * `/planning/assistant` route (see `openapi.yaml`). Same interface as
 * `MockPlanningService`, so it's a drop-in replacement — see services/index.ts.
 */
export class HttpPlanningService implements PlanningService {
  async getAssistantReply(prompt: string): Promise<PlanningReply> {
    return apiRequest<PlanningReply>("/planning/assistant", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
  }
}

/** The service instance the app uses today, backed by the real FastAPI backend. */
export const httpPlanningService: PlanningService = new HttpPlanningService();
