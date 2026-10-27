import { defineConfig } from "drizzle-kit";

process.loadEnvFile();
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (see .env.example)");

export default defineConfig({
  dialect: "postgresql",
  schema: "./api/src/db/schema.ts",
  out: "./api/drizzle",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL },
});
