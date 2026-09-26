import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "../../../app/routes/customers.$customerId";
import * as authorization from "../../../app/server/auth/authorization/policies/can";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { createDraftInvoice } from "../../../app/server/features/invoices/services/create-draft-invoice.server";
import { createInvoiceItem } from "../../../app/server/features/invoices/services/create-invoice-item.server";
import { issueInvoice } from "../../../app/server/features/invoices/services/issue-invoice.server";
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import { recordPayment } from "../../../app/server/features/payments/services/record-payment.server";
import { voidPayment } from "../../../app/server/features/payments/services/void-payment.server";
import CustomerPage from "../../../app/ui/features/customers/pages/customer-page/customer-page";
import { issuedInvoiceFixture } from "../../support/fixtures/issued-invoice";

let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;
let context: RouterContextProvider;
const args = (customerId = "customer") => ({
  context,
  request: new Request(`https://example.test/customers/${customerId}`),
  url: new URL(`https://example.test/customers/${customerId}`),
  params: { customerId },
  pattern: "/customers/:customerId",
});
function render(result: Awaited<ReturnType<typeof loader>>) {
  return renderToStaticMarkup(
    <RouterProvider
      router={createMemoryRouter([
        { path: "/", element: <CustomerPage {...result} /> },
      ])}
    />,
  );
}

beforeEach(async () => {
  fixture = await issuedInvoiceFixture();
  context = new RouterContextProvider();
  context.set(currentUserContext, fixture.admin);
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  await createDb(env.DB)
    .update(customers)
    .set({
      email: "john@example.test",
      addressLine1: "1 Lawn Street",
      suburb: "Seymour",
      state: "VIC",
      postcode: "3660",
      notes: "Close the gate",
    })
    .where(eq(customers.id, "customer"));
});
afterEach(() => vi.restoreAllMocks());

it.each(["admin", "operator"] as const)(
  "renders customer details and read-only financial histories for %s",
  async (role) => {
    context.set(currentUserContext, { ...fixture.admin, role });
    await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
      amountCents: 2500,
      paymentDate: "2026-09-24",
    });
    const voided = await recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      { amountCents: 1000, paymentDate: "2026-09-24" },
    );
    await voidPayment(env.DB, fixture.admin, fixture.invoiceId, voided.id);
    await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);
    const draft = await createDraftInvoice(env.DB, fixture.admin, {
      jobIds: [fixture.otherJobId],
    });
    const issued = await createDraftInvoice(env.DB, fixture.admin, {
      jobIds: [fixture.jobId],
    });
    await createInvoiceItem(env.DB, fixture.admin, issued.id, {
      jobId: fixture.jobId,
      description: "New service",
      amountCents: 2000,
    });
    await issueInvoice(env.DB, fixture.admin, issued.id, {
      dueDate: "2026-10-01",
    });
    const result = await loader(args());
    expect(result.financialHistory?.summary).toEqual({
      totalInvoicedCents: 12000,
      paidCents: 2500,
      outstandingCents: 2000,
    });
    const html = render(result);
    for (const text of [
      "John Smith",
      "john@example.test",
      "1 Lawn Street",
      "Close the gate",
      "Financial overview",
      "Seymour VIC 3660",
      "Total invoiced",
      "$120.00",
      "Payments received",
      "$25.00",
      "Outstanding balance",
      "$20.00",
      "Draft invoice",
      "INV-000001",
      "INV-000002",
      ">Draft</span>",
      ">Issued</span>",
      ">Voided</span>",
    ])
      expect(html).toContain(text);
    for (const id of [fixture.invoiceId, draft.id, issued.id])
      expect(html).toContain(`href="/invoices/${id}"`);
    const paymentList =
      html.match(
        /<table[^>]*aria-label="Customer payments"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/,
      )?.[1] ?? "";
    const rows = paymentList.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? [];
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.includes("$25.00"))).toContain(
      ">Active</span>",
    );
    expect(rows.find((row) => row.includes("$10.00"))).toContain(
      ">Voided</span>",
    );
    for (const row of rows) {
      expect(row).toContain(`href="/invoices/${fixture.invoiceId}"`);
      expect(row).toContain("INV-000001");
      expect(row).toContain("dateTime=");
    }
    for (const payment of result.financialHistory!.payments) {
      expect(paymentList).toContain(
        new Intl.DateTimeFormat("en-AU", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(`${payment.paymentDate}T00:00:00Z`)),
      );
    }
    const finances = html.slice(
      html.indexOf('aria-labelledby="financial-summary-heading"'),
      html.indexOf('aria-labelledby="customer-danger-heading"'),
    );
    expect(finances).not.toContain("<form");
    expect(finances).not.toContain("<button");
    expect(html).toContain("Edit customer");
    expect(html).toContain("Confirm archive");
    expect(html.indexOf("Danger zone")).toBeGreaterThan(
      html.indexOf("Payment history"),
    );
  },
);

it("renders empty financial history and zero totals", async () => {
  await createDb(env.DB).insert(customers).values({
    id: "empty",
    name: "Empty Customer",
    createdAt: 1,
    updatedAt: 1,
  });
  const html = render(await loader(args("empty")));
  expect(html).toContain("No invoices for this customer yet.");
  expect(html).toContain("No payments recorded for this customer yet.");
  expect(html.match(/\$0\.00/g)).toHaveLength(3);
});

it("keeps financial history available for archived customers and preserves restore behaviour", async () => {
  await createDb(env.DB)
    .update(customers)
    .set({ archivedAt: 1 })
    .where(eq(customers.id, "customer"));
  const html = render(await loader(args()));
  expect(html).toContain("INV-000001");
  expect(html).toContain("Restore customer");
  expect(html).not.toContain("Edit customer");
  expect(html).toContain('href="/customers/archived"');
});

it.each(["invoices.read", "payments.read"] as const)(
  "preserves customer access without exposing finances when %s is denied",
  async (denied) => {
    const original = authorization.can;
    vi.spyOn(authorization, "can").mockImplementation(
      (user, permission) => permission !== denied && original(user, permission),
    );
    const result = await loader(args());
    expect(result.financialHistory).toBeNull();
    const html = render(result);
    expect(html).toContain("John Smith");
    expect(html).not.toContain("Financial overview");
    expect(html).not.toContain("INV-000001");
  },
);

it("preserves customer permission denial as 403", async () => {
  const original = authorization.can;
  vi.spyOn(authorization, "can").mockImplementation(
    (user, permission) =>
      permission !== "customers.read" && original(user, permission),
  );
  await expect(loader(args())).rejects.toMatchObject({ status: 403 });
});

it("preserves missing customer 404", async () => {
  await expect(loader(args("missing"))).rejects.toMatchObject({ status: 404 });
});

it("requires authenticated user context", async () => {
  context = new RouterContextProvider();
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  await expect(loader(args())).rejects.toThrow();
});
