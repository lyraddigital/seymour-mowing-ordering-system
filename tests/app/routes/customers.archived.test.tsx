import { env } from "cloudflare:workers";
import { expect, it } from "vitest";
import { MemoryRouter, RouterContextProvider } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "../../../app/routes/customers.archived";
import ArchivedCustomersPage from "../../../app/ui/features/customers/pages/archived-customers-page/archived-customers-page";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
it("renders archived customers and a link to the active list", async () => {
  await createDb(env.DB).delete(customers);
  await createDb(env.DB).insert(customers).values({
    id: "customer",
    name: "Visible customer",
    createdAt: 1,
    updatedAt: 1,
    archivedAt: 2,
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
    request: new Request("https://example.test/customers/archived"),
    url: new URL("https://example.test/customers/archived"),
    params: {},
    pattern: "/customers/archived",
  });
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <ArchivedCustomersPage customers={result.customers} />
    </MemoryRouter>,
  );
  expect(html).toContain("Visible customer");
  expect(html).toContain('href="/customers"');
});
