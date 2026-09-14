import { defineConfig } from "drizzle-kit";

// Generate SQL offline. Wrangler owns local/remote D1 migration application.
export default defineConfig({
  dialect: "sqlite",
  schema: "./app/server/db/schema/schema-registry.ts",
  out: "./drizzle/migrations",
  strict: true,
  verbose: true,
});
