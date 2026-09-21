import { CustomerStateConflictError } from "../../../../../../app/server/features/customers/errors/customer-state-conflict-error";
import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { updateCustomer } from "../../../../../../app/server/features/customers/services/update-customer.server";
import { createCustomer } from "../../../../../../app/server/features/customers/services/create-customer.server";
import { CustomerValidationError } from "../../../../../../app/server/features/customers/errors/customer-validation-error";
import { CustomerNotFoundError } from "../../../../../../app/server/features/customers/errors/customer-not-found-error";
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
  createdAt: 1,
  updatedAt: 2,
  archivedAt: null,
};
beforeEach(async () => {
  await createDb(env.DB).delete(customers);
  await createDb(env.DB).insert(customers).values(original);
});
it("updates every editable field with creation's normalization and preserves history", async () => {
  const input = {
    name: " New name ",
    email: " a@example.test ",
    phone: " 123 ",
    addressLine1: " 1 Main St ",
    addressLine2: " Unit 2 ",
    suburb: " Seymour ",
    state: " VIC ",
    postcode: " 3660 ",
    notes: " line one\nline two ",
  };
  const before = Date.now();
  expect(await updateCustomer(env.DB, user, original.id, input)).toEqual({
    id: original.id,
  });
  const saved = (await createDb(env.DB).select().from(customers))[0];
  expect(saved).toMatchObject({
    ...original,
    name: "New name",
    email: "a@example.test",
    phone: "123",
    addressLine1: "1 Main St",
    addressLine2: "Unit 2",
    suburb: "Seymour",
    state: "VIC",
    postcode: "3660",
    notes: input.notes.trim(),
    updatedAt: expect.any(Number),
  });
  expect(saved.updatedAt).toBeGreaterThanOrEqual(before);
  expect(saved.updatedAt).toBeGreaterThan(original.updatedAt);
  const created = await createCustomer(env.DB, user, input);
  const rows = await createDb(env.DB).select().from(customers);
  expect(rows).toHaveLength(2);
  const comparison = rows.find((row) => row.id === created.id)!;
  for (const key of Object.keys(input) as (keyof typeof input)[])
    expect(saved[key]).toBe(comparison[key]);
});
it("clears all optional blank fields", async () => {
  const fields = {
    email: "old",
    phone: "old",
    addressLine1: "old",
    addressLine2: "old",
    suburb: "old",
    postcode: "old",
    notes: "old",
  };
  await updateCustomer(env.DB, user, original.id, { name: "Name", ...fields });
  await updateCustomer(env.DB, user, original.id, {
    name: "Name",
    ...Object.fromEntries(Object.keys(fields).map((key) => [key, "  \t "])),
  });
  const saved = await createDb(env.DB).select().from(customers).get();
  for (const key of Object.keys(fields) as (keyof typeof fields)[])
    expect(saved![key]).toBeNull();
  expect(saved!.state).toBe("VIC");
});
it.each(["", "  ", "\t\n"])(
  "rejects blank name %j without changing the row",
  async (name) => {
    await expect(
      updateCustomer(env.DB, user, original.id, { name }),
    ).rejects.toBeInstanceOf(CustomerValidationError);
    expect(await createDb(env.DB).select().from(customers).get()).toMatchObject(
      original,
    );
  },
);
it("reports unknown customers without inserting", async () => {
  await expect(
    updateCustomer(env.DB, user, "missing", { name: "Name" }),
  ).rejects.toBeInstanceOf(CustomerNotFoundError);
  expect(await createDb(env.DB).select().from(customers)).toHaveLength(1);
});
it("enforces permission before updating", async () => {
  await expect(
    updateCustomer(
      env.DB,
      { ...user, role: "unknown" as typeof user.role },
      original.id,
      { name: "Changed" },
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
  expect(await createDb(env.DB).select().from(customers).get()).toMatchObject(
    original,
  );
});

it("requires restoration before editing archived customers", async () => {
  await createDb(env.DB).update(customers).set({ archivedAt: 3 });
  await expect(
    updateCustomer(env.DB, user, original.id, { name: "Changed" }),
  ).rejects.toBeInstanceOf(CustomerStateConflictError);
  expect(await createDb(env.DB).select().from(customers).get()).toMatchObject({
    ...original,
    archivedAt: 3,
  });
});
it("replaces an old state with VIC and ignores client-supplied state", async () => {
  await createDb(env.DB).update(customers).set({ state: "NSW" });
  const input = { name: "Updated", suburb: "Seymour", state: "QLD" };
  await updateCustomer(env.DB, user, original.id, input);
  expect(await createDb(env.DB).select().from(customers).get()).toMatchObject({
    state: "VIC",
    suburb: "Seymour",
  });
});
