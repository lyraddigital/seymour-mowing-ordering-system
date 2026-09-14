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
import { createCustomer } from "../../../../../../app/server/features/customers/services/create-customer.server";
import { CustomerValidationError } from "../../../../../../app/server/features/customers/errors/customer-validation-error";
import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
it("creates an active customer, trims text, and stores optional blanks as null", async () => {
  const before = Date.now();
  const result = await createCustomer(env.DB, user, {
    name: "  Acme Turf  ",
    email: " info@example.test ",
    phone: " ",
    addressLine1: " 1 Main St ",
    notes: " hello \n",
  });
  const saved = await createDb(env.DB).select().from(customers).get();
  expect(saved).toMatchObject({
    id: result.id,
    name: "Acme Turf",
    email: "info@example.test",
    phone: null,
    addressLine1: "1 Main St",
    addressLine2: null,
    suburb: null,
    state: null,
    postcode: null,
    notes: "hello",
    archivedAt: null,
  });
  expect(saved!.createdAt).toBeGreaterThanOrEqual(before);
  expect(saved!.updatedAt).toBe(saved!.createdAt);
});
it.each(["", "  ", "\t\n"])(
  "rejects blank name %j without insertion",
  async (name) => {
    await expect(createCustomer(env.DB, user, { name })).rejects.toBeInstanceOf(
      CustomerValidationError,
    );
    expect(await createDb(env.DB).select().from(customers)).toEqual([]);
  },
);
it("enforces permission before inserting", async () => {
  await expect(
    createCustomer(
      env.DB,
      { ...user, role: "unknown" as typeof user.role },
      { name: "Test" },
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
it("enforces required names at the database boundary", async () => {
  await expect(
    createDb(env.DB)
      .insert(customers)
      .values({ id: "bad", name: " ", createdAt: 1, updatedAt: 1 }),
  ).rejects.toThrow();
});
