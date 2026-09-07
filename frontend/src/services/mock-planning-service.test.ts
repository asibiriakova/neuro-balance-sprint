import { describe, expect, it } from "vitest";
import { MockPlanningService } from "./mock-planning-service";

describe("MockPlanningService", () => {
  const service = new MockPlanningService();

  it("suggests Foundation tasks for a fitness/health goal", async () => {
    const reply = await service.getAssistantReply("Decompose my fitness goal");
    expect(reply.suggestions?.every((s) => s.pillar === "foundation")).toBe(true);
  });

  it("suggests a Drive backlog for career/skill goals", async () => {
    const reply = await service.getAssistantReply("Suggest 10h Drive backlog");
    expect(reply.suggestions?.every((s) => s.pillar === "drive")).toBe(true);
  });

  it("suggests recovery tasks when balancing cognitive load", async () => {
    const reply = await service.getAssistantReply("Balance my cognitive load");
    expect(reply.suggestions?.some((s) => s.pillar === "joy")).toBe(true);
  });

  it("falls back to a generic three-pillar decomposition for unmatched goals", async () => {
    const reply = await service.getAssistantReply("Learn to paint");
    expect(reply.suggestions?.map((s) => s.pillar)).toEqual(["drive", "foundation", "joy"]);
    expect(reply.suggestions?.every((s) => s.title.includes("Learn to paint"))).toBe(true);
  });

  it("is case-insensitive", async () => {
    const reply = await service.getAssistantReply("FITNESS please");
    expect(reply.suggestions?.every((s) => s.pillar === "foundation")).toBe(true);
  });
});
