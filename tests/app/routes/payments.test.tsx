import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { MemoryRouter, RouterContextProvider } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";

import { loader } from "../../../app/routes/payments";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { recordPayment } from "../../../app/server/features/payments/services/record-payment.server";
import { voidPayment } from "../../../app/server/features/payments/services/void-payment.server";
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import PaymentsPage from "../../../app/ui/features/payments/pages/payments-page/payments-page";
import { issuedInvoiceFixture } from "../../support/fixtures/issued-invoice";

let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;
let context: RouterContextProvider;
const args = () => ({
  context,
  request: new Request("https://example.test/payments"),
  url: new URL("https://example.test/payments"),
  params: {},
  pattern: "/payments",
});

beforeEach(async () => {
  fixture = await issuedInvoiceFixture();
  context = new RouterContextProvider();
  context.set(currentUserContext, fixture.admin);
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
});

it.each(["admin", "operator"] as const)(
  "loads and renders payment history for %s",
  async (role) => {
    context.set(currentUserContext, { ...fixture.admin, role });
    await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
      amountCents: 1234,
    });
    const voided = await recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      { amountCents: 2500 },
    );
    await voidPayment(env.DB, fixture.admin, fixture.invoiceId, voided.id);
    await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);
    const result = await loader(args());
    expect(result.payments).toHaveLength(2);
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PaymentsPage payments={result.payments} />
      </MemoryRouter>,
    );
    expect(html).toContain('aria-label="Payments"');
    const rows = html.match(/<li\b[^>]*>[\s\S]*?<\/li>/g) ?? [];
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.includes("$12.34"))).toContain(
      ">Active</span>",
    );
    expect(rows.find((row) => row.includes("$25.00"))).toContain(
      ">Voided</span>",
    );
    expect(html).toContain(`href="/invoices/${fixture.invoiceId}"`);
    expect(html).toContain("INV-000001");
    expect(html).toContain('href="/customers/customer"');
    expect(html).toContain("John Smith");
    for (const payment of result.payments) {
      expect(html).toContain(
        `dateTime="${new Date(payment.receivedAt).toISOString()}"`,
      );
      expect(html).toContain(
        new Intl.DateTimeFormat("en-AU", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(payment.receivedAt)),
      );
    }
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Record payment");
    expect(html).not.toContain("Void payment");
  },
);

it("renders a useful empty state", async () => {
  const result = await loader(args());
  expect(result.payments).toEqual([]);
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <PaymentsPage payments={result.payments} />
    </MemoryRouter>,
  );
  expect(html).toContain("No payments yet");
  expect(html).toContain("Payments recorded on invoices will appear here.");
  expect(html).toContain('href="/invoices"');
});

it("maps permission denial to 403", async () => {
  context.set(currentUserContext, {
    ...fixture.admin,
    role: "unknown" as "admin",
  });
  await expect(loader(args())).rejects.toMatchObject({ status: 403 });
});

it("requires authenticated user context", async () => {
  context = new RouterContextProvider();
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  await expect(loader(args())).rejects.toThrow();
});
