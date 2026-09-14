import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Preserve Wrangler's nested migration layout. The supported reader handles SQL
// splitting; prefix names so each folder's migration.sql has a unique identity.
const migrationRoot = new URL("./drizzle/migrations/", import.meta.url);
const directories = (await readdir(migrationRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== "meta")
  .map((entry) => entry.name)
  .sort();
const migrations = (
  await Promise.all(
    directories.map(async (directory) => {
      const files = await readD1Migrations(
        fileURLToPath(new URL(`${directory}/`, migrationRoot)),
      );
      return files
        .filter((file) => file.name === "migration.sql")
        .map((file) => ({ ...file, name: `${directory}/${file.name}` }));
    }),
  )
).flat();
if (migrations.length === 0)
  throw new Error("No committed D1 migrations found");

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc", environment: "" },
    }),
  ],
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/support/setup.ts"],
    provide: { migrations },
  },
});
