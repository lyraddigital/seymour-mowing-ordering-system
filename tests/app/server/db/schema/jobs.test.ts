import { env } from "cloudflare:workers";
import { expect, inject, it } from "vitest";

it("migrates existing jobs without losing descriptions, relationships or history", async () => {
  const migrations = inject("migrations");
  const upgrade = migrations.find(
    (migration) => migration.name === "0003_kind_tyrannus/migration.sql",
  );
  expect(upgrade).toBeDefined();
  // Recreate the previous schema only in this file's isolated test database.
  await env.DB.batch([
    ...["job_status_history", "jobs", "customers", "users"].map((table) =>
      env.DB.prepare(`DROP TABLE ${table}`),
    ),
    ...migrations
      .filter((migration) => migration.name < "0003")
      .flatMap((migration) =>
        migration.queries.map((query) => env.DB.prepare(query)),
      ),
  ]);
  await env.DB.prepare(
    "INSERT INTO users VALUES ('user', 'user@example.test', 'User', 'admin', 1, 1, 1)",
  ).run();
  await env.DB.prepare(
    "INSERT INTO customers (id, name, created_at, updated_at) VALUES ('customer', 'Customer', 1, 1)",
  ).run();
  const description = "  " + "Long description ".repeat(30);
  await env.DB.prepare(
    "INSERT INTO jobs VALUES ('job', 'customer', ?, '2026-09-17', 1, 2)",
  )
    .bind(description)
    .run();
  await env.DB.prepare(
    "INSERT INTO job_status_history VALUES ('history', 'job', 'scheduled', 'user', 3)",
  ).run();
  await env.DB.batch(upgrade!.queries.map((query) => env.DB.prepare(query)));
  expect(await env.DB.prepare("SELECT * FROM jobs").first()).toEqual({
    id: "job",
    customer_id: "customer",
    name: description.trim().slice(0, 200).trim(),
    description,
    scheduled_date: "2026-09-17",
    created_at: 1,
    updated_at: 2,
  });
  expect(
    await env.DB.prepare("SELECT * FROM job_status_history").first(),
  ).toEqual({
    id: "history",
    job_id: "job",
    status: "scheduled",
    created_by_user_id: "user",
    created_at: 3,
  });
  expect(
    (await env.DB.prepare("PRAGMA foreign_key_check").all()).results,
  ).toEqual([]);
  for (const name of [null, " ", "x".repeat(201)]) {
    await expect(
      env.DB.prepare("UPDATE jobs SET name = ? WHERE id = 'job'")
        .bind(name)
        .run(),
    ).rejects.toThrow();
  }
  await expect(
    env.DB.prepare("DELETE FROM jobs WHERE id = 'job'").run(),
  ).rejects.toThrow();
});
