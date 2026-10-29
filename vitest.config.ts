import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      LLM_MODEL: "test-model",
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
    },
  },
});
