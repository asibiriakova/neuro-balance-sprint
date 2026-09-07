// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const nitroPreset = process.env["NITRO_PRESET"];

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Local dev and the default `bun run build` keep nitro's zero-config
  // Cloudflare target (see the comment above). The Docker image (../Dockerfile)
  // sets NITRO_PRESET=node-server instead: it needs a plain Node HTTP server
  // it can spawn and reverse-proxy from the Python backend, since the app has
  // no server functions/loaders (see src/services/) and doesn't need an edge
  // runtime.
  ...(nitroPreset ? { nitro: { preset: nitroPreset } } : {}),
});
