import { createMockService } from "./mock/mock-service";
import type { NeuroSprintService } from "./types";

export * from "./types";

/**
 * Single entry point for every backend call in the app.
 * Swap this factory for a real implementation (HTTP / Lovable Cloud)
 * and nothing else in the UI has to change.
 */
let instance: NeuroSprintService | null = null;

export function getService(): NeuroSprintService {
  if (!instance) instance = createMockService();
  return instance;
}

/** Useful for tests or for switching to a real backend at runtime. */
export function setService(service: NeuroSprintService) {
  instance = service;
}

export const services = {
  get sprint() {
    return getService();
  },
};
