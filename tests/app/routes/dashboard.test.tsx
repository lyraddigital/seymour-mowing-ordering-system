import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { loader } from "../../../app/routes/dashboard";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { invoices } from "../../../app/server/db/schema/invoices";
import { payments } from "../../../app/server/db/schema/payments";
import DashboardPage from "../../../app/ui/features/dashboard/pages/dashboard-page/dashboard-page";
import { draftInvoiceFixture } from "../../support/fixtures/draft-invoice";
import { issuedInvoiceFixture } from "../../support/fixtures/issued-invoice";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();

let context: RouterContextProvider;

function args() {
  return {
    context,
    request: new Request("https://example.test/dashboard"),
    url: new URL("https://example.test/dashboard"),
    params: {},
    pattern: "/dashboard",
  };
}

function renderDashboardPage(
  dashboard: Awaited<ReturnType<typeof loader>>["dashboard"],
) {
  const router = createMemoryRouter(
    [
      {
        path: "/dashboard",
        element: <DashboardPage dashboard={dashboard} />,
      },
    ],
    {
      initialEntries: ["/dashboard"],
    },
  );

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-22T00:00:00Z"));

  context = new RouterContextProvider();
  context.set(currentUserContext, user);
  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

it("renders the populated dashboard", async () => {
  const fixture = await issuedInvoiceFixture();
  const db = createDb(env.DB);

  await db
    .update(invoices)
    .set({
      dueDate: "2026-09-10",
    })
    .where(eq(invoices.id, fixture.invoiceId));

  await db.insert(payments).values({
    id: "dashboard-payment",
    invoiceId: fixture.invoiceId,
    amountCents: 3000,
    paymentDate: "2026-09-22",
    createdAt: Date.now(),
  });

  const result = await loader(args());

  const html = renderDashboardPage(result.dashboard);

  expect(html).toContain("Dashboard");
  expect(html).toContain(
    "Financial health and operational activity at a glance.",
  );

  expect(html).toContain("Outstanding balance");
  expect(html).toContain("$70.00");

  expect(html).toContain("Overdue balance");
  expect(html).toContain("Invoices overdue");

  expect(html).toContain("Payments received this month");
  expect(html).toContain("$30.00");

  expect(html).toContain("Needs attention");
  expect(html).toContain("Overdue invoices");
  expect(html).toContain("John Smith");
  expect(html).toContain("INV-000001");
  expect(html).toContain("10 Sept 2026");
  expect(html).toContain("12 days");

  expect(html).toContain("Partially paid / unpaid invoices");
  expect(html).toContain("Partially paid");

  expect(html).toContain("Recent payments");
  expect(html).toContain('href="/payments"');

  expect(html).toContain("Today&#x27;s jobs");

  expect(html).toContain('href="/invoices"');
  expect(html).toContain(`href="/invoices/${fixture.invoiceId}"`);
  expect(html).toContain('href="/customers/customer"');
});

it("renders the approved empty dashboard state", async () => {
  await draftInvoiceFixture();

  const result = await loader(args());

  const html = renderDashboardPage(result.dashboard);

  expect(html).toContain("Outstanding balance");
  expect(html).toContain("Overdue balance");
  expect(html).toContain("Invoices overdue");
  expect(html).toContain("Payments received this month");

  expect(html).toContain("All caught up!");
  expect(html).toContain(
    "There are no invoices that need attention right now.",
  );

  expect(html).toContain("No unpaid invoices");
  expect(html).toContain("All invoices are paid in full. Great work!");

  expect(html).toContain("No recent payments");
  expect(html).toContain("Payments you receive will appear here.");

  expect(html).toContain("No jobs scheduled today");
  expect(html).toContain(
    "Enjoy the day! New jobs will appear here when they&#x27;re scheduled.",
  );

  expect(html).not.toContain("Unavailable");
  expect(html).not.toContain("Invoice due dates required");
});

it("does not treat an invoice due today as needing attention", async () => {
  const fixture = await issuedInvoiceFixture();

  await createDb(env.DB)
    .update(invoices)
    .set({
      dueDate: "2026-09-22",
    })
    .where(eq(invoices.id, fixture.invoiceId));

  const result = await loader(args());

  const html = renderDashboardPage(result.dashboard);

  expect(html).toContain("All caught up!");
  expect(html).not.toContain("days overdue");
});

it("denies access without the required read permissions", async () => {
  context.set(currentUserContext, {
    ...user,
    role: "unknown" as "admin",
  });

  await expect(loader(args())).rejects.toMatchObject({
    status: 403,
  });
});

it("requires the authenticated user context", async () => {
  context = new RouterContextProvider();

  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  await expect(loader(args())).rejects.toThrow();
});
