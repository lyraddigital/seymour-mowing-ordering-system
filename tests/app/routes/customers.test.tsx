import { env } from "cloudflare:workers";
import { expect, it } from "vitest";
import { MemoryRouter, RouterContextProvider } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "../../../app/routes/customers";
import CustomersPage from "../../../app/ui/features/customers/pages/customers-page/customers-page";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
it("renders customers returned by the loader and a creation link", async () => {
  await createDb(env.DB).delete(customers);
  await createDb(env.DB).insert(customers).values({
    id: "customer",
    name: "Visible customer",
    createdAt: 1,
    updatedAt: 1,
  });
  const context = new RouterContextProvider();
  context.set(currentUserContext, {
    id: "admin",
    email: "admin@example.test",
    displayName: "Admin",
    role: "admin",
  });
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  const result = await loader({
    context,
    request: new Request("https://example.test/customers"),
    url: new URL("https://example.test/customers"),
    params: {},
    pattern: "/customers",
  });
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <CustomersPage customers={result.customers} />
    </MemoryRouter>,
  );
  expect(html).toContain("Visible customer");
  expect(html).toContain('href="/customers/new"');
  expect(html).toContain("<table");
  expect(html).toContain('aria-label="Active customers"');
  expect(html).toContain('scope="col">Email');
  expect(html).toContain('scope="col">Phone');
  expect(html).toContain('scope="col">Address');
  expect(html).toContain('aria-label="View Visible customer"');
  expect(html).toContain('href="/customers/archived"');
});
