// The app's single services layer: every backend call goes through the
// typed interfaces exported here. `sprintService`/`planningService` are now
// backed by the real FastAPI backend (`../../backend`, per `../../openapi.yaml`)
// over HTTP — see `http-sprint-service.ts` / `http-planning-service.ts`. The
// original localStorage / keyword-matched `Mock*` implementations are kept
// exported for tests and for running the app with zero backend.
export type { NewTaskInput, SprintData, SprintService } from "./sprint-service";
export { MockSprintService } from "./mock-sprint-service";
export { HttpSprintService, httpSprintService as sprintService } from "./http-sprint-service";
export type { PlanningReply, PlanningService, PlanningSuggestion } from "./planning-service";
export { MockPlanningService } from "./mock-planning-service";
export {
  HttpPlanningService,
  httpPlanningService as planningService,
} from "./http-planning-service";
