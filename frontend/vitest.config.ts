// Dedicated vitest config, separate from vite.config.ts (which is owned by
// @lovable.dev/vite-tanstack-config and must not be hand-edited — see the
// comment at the top of that file). Vitest picks this file up on its own.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
    css: false,
  },
});
