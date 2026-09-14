import { env } from "cloudflare:workers";
import { expect, it } from "vitest";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { listArchivedCustomers } from "../../../../../../app/server/features/customers/queries/list-archived-customers.server";
import { listActiveCustomers } from "../../../../../../app/server/features/customers/queries/list-active-customers.server";
const user = {
  id: "admin",
  email: "admin@example.test",
  displayName: "Admin",
  role: "admin" as const,
};
it("filters archived rows in deterministic name/id order", async () => {
  await createDb(env.DB).delete(customers);
  await createDb(env.DB)
    .insert(customers)
    .values(
      [
        { id: "z", name: "Zed", archivedAt: 3 },
        { id: "b", name: "Same", archivedAt: 3 },
        { id: "a", name: "Same", archivedAt: 3 },
        { id: "active", name: "Active", archivedAt: null },
      ].map((row) => ({ ...row, createdAt: 1, updatedAt: 2 })),
    );
  expect(
    (await listArchivedCustomers(env.DB, user)).map((row) => row.id),
  ).toEqual(["a", "b", "z"]);
  expect(
    (await listActiveCustomers(env.DB, user)).map((row) => row.id),
  ).toEqual(["active"]);
});
