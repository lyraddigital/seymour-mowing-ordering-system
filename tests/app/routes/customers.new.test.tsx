import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import {
  RouterContextProvider,
  createMemoryRouter,
  RouterProvider,
} from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { action, loader } from "../../../app/routes/customers.new";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import NewCustomerPage from "../../../app/ui/features/customers/pages/new-customer-page/new-customer-page";

const context = new RouterContextProvider();
context.set(currentUserContext, {
  id: "admin",
  email: "admin@example.test",
  displayName: "Admin",
  role: "admin",
});
context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
const submit = (values: Record<string, string>) =>
  action({
    request: new Request("https://example.test/customers/new", {
      method: "POST",
      body: new URLSearchParams(values),
    }),
    context,
    params: {},
    url: new URL("https://example.test/customers/new"),
    pattern: "/customers/new",
  } as Parameters<typeof action>[0]);
beforeEach(async () => {
  await createDb(env.DB).delete(customers);
});
it("creates a customer and redirects to the list", async () => {
  const response = await submit({ name: "New customer" });
  expect(response).toBeInstanceOf(Response);
  expect((response as Response).status).toBe(302);
  expect((response as Response).headers.get("Location")).toBe("/customers");
  expect(
    await createDb(env.DB).select({ name: customers.name }).from(customers),
  ).toEqual([{ name: "New customer" }]);
});
it("returns field feedback and preserves submitted values", async () => {
  const response = await submit({ name: " ", phone: "123" });
  expect(response).toMatchObject({
    init: { status: 400 },
    data: {
      values: { name: " ", phone: "123" },
      fieldErrors: { name: "Enter a customer name." },
    },
  });
});
it("treats a missing name as validation failure", async () => {
  expect(await submit({})).toMatchObject({ init: { status: 400 } });
});
it("renders the form with accessible validation feedback", () => {
  expect(
    loader({
      context,
      request: new Request("https://example.test/customers"),
      url: new URL("https://example.test/customers"),
      params: {},
      pattern: "/customers",
    }),
  ).toBeNull();
  const router = createMemoryRouter(
    [
      {
        path: "/customers/new",
        element: (
          <NewCustomerPage
            values={{ name: " ", phone: "123" }}
            fieldErrors={{ name: "Enter a customer name." }}
          />
        ),
      },
    ],
    { initialEntries: ["/customers/new"] },
  );
  const html = renderToStaticMarkup(<RouterProvider router={router} />);
  expect(html).toContain("<form");
  expect(html).toContain('name="name"');
  expect(html).toContain('name="notes"');
  expect(html).toContain('role="alert"');
  expect(html).toContain('value="123"');
  expect(html).toContain("Create customer");
});
