import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { RouterContextProvider } from "react-router";
import { action } from "../../../app/routes/customers.$customerId.archive";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
const context = new RouterContextProvider();
const url = "https://example.test/customers/customer/archive";
const submit = (method = "POST", customerId = "customer") =>
  action({
    context,
    params: { customerId },
    request: new Request(url, { method }),
    url: new URL(url),
    pattern: "/customers/:customerId/archive",
  } as Parameters<typeof action>[0]);
beforeEach(async () => {
  context.set(currentUserContext, {
    id: "admin",
    email: "admin@example.test",
    displayName: "Admin",
    role: "admin",
  });
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  await createDb(env.DB).delete(customers);
  await createDb(env.DB).insert(customers).values({
    id: "customer",
    name: "Name",
    createdAt: 1,
    updatedAt: 2,
    archivedAt: null,
  });
});
it("accepts POST and redirects after persisting the state", async () => {
  const response = await submit();
  expect(response.status).toBe(302);
  expect(response.headers.get("Location")).toBe("/customers");
  expect(
    (await createDb(env.DB).select().from(customers).get())?.archivedAt,
  ).toEqual(expect.any(Number));
});
it.each(["GET", "PUT", "PATCH", "DELETE"])(
  "rejects %s with 405",
  async (method) => {
    await expect(submit(method)).rejects.toMatchObject({ status: 405 });
    expect(
      (await createDb(env.DB).select().from(customers).get())?.archivedAt,
    ).toBe(null);
  },
);
it("returns 404 for a missing customer", async () => {
  await expect(submit("POST", "missing")).rejects.toMatchObject({
    status: 404,
  });
});
it("returns 403 without permission", async () => {
  context.set(currentUserContext, {
    ...context.get(currentUserContext),
    role: "unknown" as "admin",
  });
  await expect(submit()).rejects.toMatchObject({ status: 403 });
});
it("returns 409 for invalid current state", async () => {
  await createDb(env.DB).update(customers).set({ archivedAt: 3 });
  await expect(submit()).rejects.toMatchObject({ status: 409 });
});
