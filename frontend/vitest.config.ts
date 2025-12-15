import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      statements: 75,
      branches: 70,
      functions: 75,
      lines: 75,
      // also provide an explicit global threshold object for clarity
      threshold: {
        global: {
          statements: 75,
          branches: 70,
          functions: 75,
          lines: 75,
        },
      },
    },
  },
});
