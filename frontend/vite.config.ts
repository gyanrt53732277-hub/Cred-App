import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { fileURLToPath } from "node:url";

// The web app consumes the CrediFi contract package directly from the shared
// monorepo source (compiled Compact artifacts live under contract/src/managed).
export default defineConfig({
  plugins: [react(), wasm()],
  // The Midnight onchain WASM runtime uses top-level await; target ESNext so
  // esbuild does not down-level the injected wasm bootstrap. 
  build: { target: "esnext" },
  resolve: {
    alias: {
      // Map the workspace dependency to its TypeScript source so the browser
      // bundle and Vitest always use the freshly compiled contract artifacts.
      "credifi-contract": fileURLToPath(new URL("../contract/src/index.ts", import.meta.url)),
    },
  },
  server: { port: 5173 },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    include: ["src/test/**/*.{test,spec}.{ts,tsx}"],
    isolate: false,
    maxWorkers: 1,
  },
});
