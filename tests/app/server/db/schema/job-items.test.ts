import { env } from "cloudflare:workers";
import { expect, inject, it } from "vitest";

it("preserves legacy charge values and metadata when migrating to quantity and unit price", async () => {
  const migrations = inject("migrations");
  const upgrade = migrations.find((migration) =>
    migration.name.startsWith("0014_"),
  )!;
  // Recreate only job_items in this file's isolated D1 database.
  await env.DB.prepare("DROP TABLE job_items").run();
  const original = migrations
    .flatMap((migration) => migration.queries)
    .find((query) => query.includes("CREATE TABLE `job_items`"))!;
  await env.DB.prepare(original).run();
  await env.DB.prepare(
    "INSERT INTO customers (id, name, created_at, updated_at) VALUES ('customer', 'Customer', 1, 1)",
  ).run();
  await env.DB.prepare(
    "INSERT INTO jobs (id, customer_id, name, description, scheduled_date, created_at, updated_at) VALUES ('job', 'customer', 'Lawn', 'Mow', '2026-09-29', 1, 1)",
  ).run();
  for (const amount of [0, 2345, 10000]) {
    await env.DB.prepare(
      "INSERT INTO job_items (id, job_id, description, amount_cents, created_at, updated_at) VALUES (?, 'job', 'Green waste', ?, 12, 34)",
    )
      .bind(`charge-${amount}`, amount)
      .run();
  }
  await env.DB.batch(upgrade.queries.map((query) => env.DB.prepare(query)));
  const rows = await env.DB.prepare(
    "SELECT * FROM job_items ORDER BY unit_price_cents",
  ).all();
  expect(rows.results).toEqual(
    [0, 2345, 10000].map((amount) => ({
      id: `charge-${amount}`,
      job_id: "job",
      description: "Green waste",
      quantity: 1,
      unit_price_cents: amount,
      created_at: 12,
      updated_at: 34,
    })),
  );
  expect(
    (await env.DB.prepare("PRAGMA foreign_key_check").all()).results,
  ).toEqual([]);
  for (const quantity of [0, -1, 1.5, "invalid"]) {
    await expect(
      env.DB.prepare("UPDATE job_items SET quantity = ?").bind(quantity).run(),
    ).rejects.toThrow();
  }
  for (const price of [-1, 1.5, "invalid"]) {
    await expect(
      env.DB.prepare("UPDATE job_items SET unit_price_cents = ?")
        .bind(price)
        .run(),
    ).rejects.toThrow();
  }
  await env.DB.prepare(
    "UPDATE job_items SET quantity = 3, unit_price_cents = 1000",
  ).run();
  expect(
    await env.DB.prepare(
      "SELECT sum(quantity * unit_price_cents) AS total FROM job_items",
    ).first(),
  ).toEqual({ total: 9000 });
  expect(
    (await env.DB.prepare("PRAGMA index_list(job_items)").all()).results,
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "job_items_job_id_idx" }),
    ]),
  );
});
