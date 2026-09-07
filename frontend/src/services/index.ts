// The app's single services layer: every backend call goes through the
// typed interfaces exported here. Today both are backed by localStorage /
// deterministic-mock implementations so the app runs with zero real
// backend; swapping in HTTP-backed implementations later means changing
// the two `mock-*-service.ts` files only, not any component.
export type { NewTaskInput, SprintData, SprintService } from "./sprint-service";
export { MockSprintService, sprintService } from "./mock-sprint-service";
export type { PlanningReply, PlanningService, PlanningSuggestion } from "./planning-service";
export { MockPlanningService, planningService } from "./mock-planning-service";
