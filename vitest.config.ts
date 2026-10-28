import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Tests never call the real API; a dummy value satisfies the startup check.
    env: { LLM_MODEL: "test-model" },
  },
});
