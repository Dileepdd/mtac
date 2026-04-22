import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: { NODE_ENV: "test" },
    setupFiles: ["./src/tests/setup.ts"],
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/modules/**/*.ts"],
      exclude: ["src/modules/**/*.types.ts", "src/modules/**/*.model.ts"],
    },
  },
});
