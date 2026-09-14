import { env } from "cloudflare:workers";
import { eq, sql } from "drizzle-orm";
import { beforeEach, expect, it } from "vitest";

import { createDb } from "../../../../../app/server/db/client/create-db.server";
import { users } from "../../../../../app/server/db/schema/users";
import { internalUser as fixture } from "../../../../support/fixtures/internal-user";

const db = () => createDb(env.DB);
beforeEach(async () => {
  await db().delete(users);
}); // Isolated test D1 only.

it("contains only the minimal user table and represents active state", async () => {
  expect(env.APP_ENV).toBe("local");
  const tables = await db().all<{ name: string }>(
    sql`select name from sqlite_master where type='table' and name in ('users','sessions','auth_challenges')`,
  );
  expect(tables).toEqual([{ name: "users" }]);
  const user = fixture();
  await db().insert(users).values(user);
  expect(await db().select().from(users)).toEqual([
    { ...user, isActive: true },
  ]);
  await db()
    .update(users)
    .set({ isActive: false })
    .where(eq(users.id, user.id));
  expect((await db().select().from(users).get())?.isActive).toBe(false);
});
it("enforces email, role and boolean invariants even for direct SQL", async () => {
  await db().insert(users).values(fixture());
  const insert = (email: string, role: string, active: number) =>
    env.DB.prepare(
      "INSERT INTO users (id,email,display_name,role,is_active,created_at,updated_at) VALUES (?,?,'Test',?,?,1,1)",
    )
      .bind(crypto.randomUUID(), email, role, active)
      .run();
  for (const email of [
    "",
    " ",
    "ADMIN@example.test",
    " admin@example.test ",
    "admin@example.test",
  ])
    await expect(insert(email, "admin", 1)).rejects.toThrow();
  await expect(insert("other@example.test", "owner", 1)).rejects.toThrow();
  for (const active of [-1, 2])
    await expect(
      insert("other@example.test", "admin", active),
    ).rejects.toThrow();
  await expect(
    insert("operator@example.test", "operator", 0),
  ).resolves.toBeDefined();
});
