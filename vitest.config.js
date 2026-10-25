import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.js"],
    setupFiles: ["./tests/setup.js"],
    hookTimeout: 180000,
    testTimeout: 60000,
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
  },
});
