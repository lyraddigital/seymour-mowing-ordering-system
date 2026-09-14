import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { restoreCustomer } from "../../../../../../app/server/features/customers/services/restore-customer.server";
import { CustomerNotFoundError } from "../../../../../../app/server/features/customers/errors/customer-not-found-error";
import { CustomerStateConflictError } from "../../../../../../app/server/features/customers/errors/customer-state-conflict-error";
import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
const user = {
  id: "admin",
  email: "admin@example.test",
  displayName: "Admin",
  role: "admin" as const,
};
const original = {
  id: "customer",
  name: "Original",
  email: "a@example.test",
  phone: "123",
  addressLine1: "1 Main St",
  addressLine2: "Unit 2",
  suburb: "Seymour",
  state: "VIC",
  postcode: "3660",
  notes: "Keep notes",
  createdAt: 1,
  updatedAt: 2,
  archivedAt: 3,
};
beforeEach(async () => {
  await createDb(env.DB).delete(customers);
  await createDb(env.DB).insert(customers).values(original);
});
it("restores the customer while preserving identity and all entered data", async () => {
  const before = Date.now();
  expect(await restoreCustomer(env.DB, user, original.id)).toEqual({
    id: original.id,
  });
  const rows = await createDb(env.DB).select().from(customers);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toEqual({
    ...original,
    updatedAt: expect.any(Number),
    archivedAt: null,
  });
  expect(rows[0].updatedAt).toBeGreaterThanOrEqual(before);
});
it("rejects the wrong current state without changing data", async () => {
  await createDb(env.DB).update(customers).set({ archivedAt: null });
  await expect(
    restoreCustomer(env.DB, user, original.id),
  ).rejects.toBeInstanceOf(CustomerStateConflictError);
  expect(await createDb(env.DB).select().from(customers).get()).toEqual({
    ...original,
    archivedAt: null,
  });
});
it("reports missing customers", async () => {
  await expect(restoreCustomer(env.DB, user, "missing")).rejects.toBeInstanceOf(
    CustomerNotFoundError,
  );
});
it("enforces permission without changing data", async () => {
  await expect(
    restoreCustomer(
      env.DB,
      { ...user, role: "unknown" as "admin" },
      original.id,
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
  expect(await createDb(env.DB).select().from(customers).get()).toEqual(
    original,
  );
});
it("allows only one of two competing commands", async () => {
  const results = await Promise.allSettled([
    restoreCustomer(env.DB, user, original.id),
    restoreCustomer(env.DB, user, original.id),
  ]);
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  expect(results.find((result) => result.status === "rejected")).toMatchObject({
    reason: expect.any(CustomerStateConflictError),
  });
});
