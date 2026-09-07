import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// `globals: false` in vitest.config.ts means Testing Library's own
// auto-cleanup (which relies on detecting global afterEach) doesn't kick
// in, so wire it up explicitly to unmount between tests.
afterEach(cleanup);
