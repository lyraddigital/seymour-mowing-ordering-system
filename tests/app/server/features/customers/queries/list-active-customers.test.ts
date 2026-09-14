import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
const user = {
  id: "test",
  email: "admin@example.test",
  displayName: "Admin",
  role: "admin" as const,
};
beforeEach(async () => {
  await createDb(env.DB).delete(customers);
});
import { listActiveCustomers } from "../../../../../../app/server/features/customers/queries/list-active-customers.server";
it("returns only active customers in name then id order", async () => {
  await createDb(env.DB)
    .insert(customers)
    .values([
      { id: "z", name: "Beta", createdAt: 1, updatedAt: 1 },
      { id: "b", name: "Alpha", createdAt: 1, updatedAt: 1 },
      { id: "a", name: "Alpha", createdAt: 1, updatedAt: 1 },
      {
        id: "archived",
        name: "AAA",
        archivedAt: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);
  expect(await listActiveCustomers(env.DB, user)).toEqual(
    ["a", "b", "z"].map((id) => ({
      id,
      name: id === "z" ? "Beta" : "Alpha",
      email: null,
      phone: null,
      addressLine1: null,
      addressLine2: null,
      suburb: null,
      state: null,
      postcode: null,
    })),
  );
});
it("returns an empty list when no active customers exist", async () => {
  expect(await listActiveCustomers(env.DB, user)).toEqual([]);
});
