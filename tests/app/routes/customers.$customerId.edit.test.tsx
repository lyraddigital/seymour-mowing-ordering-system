import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import {
  RouterContextProvider,
  createMemoryRouter,
  RouterProvider,
} from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { action, loader } from "../../../app/routes/customers.$customerId.edit";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import EditCustomerPage from "../../../app/ui/features/customers/pages/edit-customer-page/edit-customer-page";
const context = new RouterContextProvider();
const url = "https://example.test/customers/customer/edit";
const args = () => ({
  context,
  params: { customerId: "customer" },
  request: new Request(url),
  url: new URL(url),
  pattern: "/customers/:customerId/edit",
});
const submit = (values: Record<string, string>) =>
  action({
    ...args(),
    request: new Request(url, {
      method: "POST",
      body: new URLSearchParams(values),
    }),
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
    name: "Existing",
    phone: "123",
    createdAt: 1,
    updatedAt: 1,
  });
});
it("loads existing data into the form and links cancel back to detail", async () => {
  const result = await loader(args() as Parameters<typeof loader>[0]);
  expect(result.customer).toMatchObject({
    id: "customer",
    name: "Existing",
    phone: "123",
  });
  const router = createMemoryRouter([
    { path: "/", element: <EditCustomerPage customer={result.customer} /> },
  ]);
  const html = renderToStaticMarkup(<RouterProvider router={router} />);
  expect(html).toContain('value="Existing"');
  expect(html).toContain('value="123"');
  expect(html).toContain('href="/customers/customer"');
  expect(html).toContain("Save changes");
  expect(html).not.toContain('name="state"');
  expect(html).not.toContain('for="state"');
});
it("redirects a valid save to detail", async () => {
  const response = await submit({ name: "Changed" });
  expect(response).toBeInstanceOf(Response);
  expect((response as Response).headers.get("Location")).toBe(
    "/customers/customer",
  );
  expect(
    (await loader(args() as Parameters<typeof loader>[0])).customer.name,
  ).toBe("Changed");
});
it("returns 400 with submitted values and accessible errors", async () => {
  const response = await submit({
    name: " ",
    phone: "456",
    notes: "Keep this",
  });
  expect(response).toMatchObject({
    init: { status: 400 },
    data: {
      values: { name: " ", phone: "456", notes: "Keep this" },
      fieldErrors: { name: "Enter a customer name." },
    },
  });
  if (response instanceof Response) throw new Error("Expected validation data");
  const { customer } = await loader(args() as Parameters<typeof loader>[0]);
  const router = createMemoryRouter([
    {
      path: "/",
      element: <EditCustomerPage customer={customer} {...response.data} />,
    },
  ]);
  const html = renderToStaticMarkup(<RouterProvider router={router} />);
  expect(html).toContain('value="456"');
  expect(html).toContain("Keep this");
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('role="alert"');
});
it("returns 404 for missing customers in both loader and direct action", async () => {
  await createDb(env.DB).delete(customers);
  await expect(
    loader(args() as Parameters<typeof loader>[0]),
  ).rejects.toMatchObject({ status: 404 });
  await expect(submit({ name: "Name" })).rejects.toMatchObject({ status: 404 });
});
it("returns 403 from loader and direct action without permission", async () => {
  context.set(currentUserContext, {
    ...context.get(currentUserContext),
    role: "unknown" as "admin",
  });
  await expect(
    loader(args() as Parameters<typeof loader>[0]),
  ).rejects.toMatchObject({ status: 403 });
  await expect(submit({ name: "Changed" })).rejects.toMatchObject({
    status: 403,
  });
});

it("redirects archived edit loads and rejects direct update POSTs", async () => {
  await createDb(env.DB).update(customers).set({ archivedAt: 3 });
  await expect(
    loader(args() as Parameters<typeof loader>[0]),
  ).rejects.toMatchObject({ status: 302 });
  await expect(submit({ name: "Changed" })).rejects.toMatchObject({
    status: 409,
  });
});
it.each([undefined, "NSW"])(
  "saves server-owned VIC without accepting state %s",
  async (state) => {
    await createDb(env.DB).update(customers).set({ state: "QLD" });
    await submit({
      name: "Local customer",
      suburb: "Seymour",
      ...(state ? { state } : {}),
    });
    expect((await loader(args())).customer).toMatchObject({
      state: "VIC",
      suburb: "Seymour",
    });
  },
);
