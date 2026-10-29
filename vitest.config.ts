import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: { LLM_MODEL: "test-model" },
  },
});
