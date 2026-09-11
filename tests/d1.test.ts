import { env } from "cloudflare:workers";
import { sql } from "drizzle-orm";
import { expect, it } from "vitest";
import { createDb } from "../app/db/client.server";

it("queries the isolated local DB binding through Drizzle without domain tables", async () => {
  expect(env.APP_ENV).toBe("local");
  const db = createDb(env.DB);
  expect(await db.get<{ value: number }>(sql`select 1 as value`)).toEqual({ value: 1 });
  const tables = await db.all<{ name: string }>(
    sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '_cf_%'`,
  );
  expect(tables).toEqual([]);
});
