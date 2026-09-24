import { env } from "cloudflare:workers";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, RouterContextProvider } from "react-router";
import { beforeEach, expect, it } from "vitest";

import { loader } from "../../../app/routes/payments";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import { recordPayment } from "../../../app/server/features/payments/services/record-payment.server";
import { voidPayment } from "../../../app/server/features/payments/services/void-payment.server";
import PaymentsPage from "../../../app/ui/features/payments/pages/payments-page/payments-page";
import { issuedInvoiceFixture } from "../../support/fixtures/issued-invoice";

let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;
let context: RouterContextProvider;

function args() {
  return {
    context,
    request: new Request("https://example.test/payments"),
    url: new URL("https://example.test/payments"),
    params: {},
    pattern: "/payments",
  };
}

function renderPage(payments: Awaited<ReturnType<typeof loader>>["payments"]) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <PaymentsPage payments={payments} />
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  fixture = await issuedInvoiceFixture();

  context = new RouterContextProvider();
  context.set(currentUserContext, fixture.admin);
  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });
});

it.each(["admin", "operator"] as const)(
  "loads and renders payment history for %s",
  async (role) => {
    context.set(currentUserContext, {
      ...fixture.admin,
      role,
    });

    const active = await recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      {
        amountCents: 1234,
      },
    );

    const voided = await recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      {
        amountCents: 2500,
      },
    );

    await voidPayment(env.DB, fixture.admin, fixture.invoiceId, voided.id);

    await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);

    const result = await loader(args());

    expect(result.payments).toHaveLength(2);

    const html = renderPage(result.payments);

    expect(html).toContain("<table");
    expect(html).toContain('aria-label="Payments"');

    expect(html).toContain("Received");
    expect(html).toContain("Customer");
    expect(html).toContain("Invoice");
    expect(html).toContain("Status");
    expect(html).toContain("Amount");
    expect(html).toContain("Details");

    expect(html).toContain("$12.34");
    expect(html).toContain("$25.00");

    expect(html).toContain(">Active</span>");
    expect(html).toContain(">Voided</span>");

    expect(html).toContain(`href="/invoices/${fixture.invoiceId}"`);
    expect(html).toContain("INV-000001");

    expect(html).toContain('href="/customers/customer"');
    expect(html).toContain("John Smith");

    expect(html).toContain("View invoice");

    for (const payment of result.payments) {
      expect(html).toContain(
        `dateTime="${new Date(payment.receivedAt).toISOString()}"`,
      );

      expect(html).toContain(
        new Intl.DateTimeFormat("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Australia/Melbourne",
        }).format(new Date(payment.receivedAt)),
      );
    }

    const activePayment = result.payments.find(
      (payment) => payment.id === active.id,
    );

    const voidedPayment = result.payments.find(
      (payment) => payment.id === voided.id,
    );

    expect(activePayment?.voidedAt).toBeNull();
    expect(voidedPayment?.voidedAt).not.toBeNull();

    expect(html).not.toContain("<form");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Record payment");
    expect(html).not.toContain("Void payment");
  },
);

it("renders payments in newest-first order", async () => {
  const first = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 1000,
  });

  const second = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 2000,
  });

  const result = await loader(args());

  expect(result.payments.map((payment) => payment.id)).toEqual([
    second.id,
    first.id,
  ]);

  const html = renderPage(result.payments);

  expect(html.indexOf("$20.00")).toBeLessThan(html.indexOf("$10.00"));
});

it("keeps voided payments in payment history", async () => {
  const payment = await recordPayment(
    env.DB,
    fixture.admin,
    fixture.invoiceId,
    {
      amountCents: 5000,
    },
  );

  await voidPayment(env.DB, fixture.admin, fixture.invoiceId, payment.id);

  const result = await loader(args());

  expect(result.payments).toEqual([
    expect.objectContaining({
      id: payment.id,
      amountCents: 5000,
      voidedAt: expect.any(Number),
    }),
  ]);

  const html = renderPage(result.payments);

  expect(html).toContain("$50.00");
  expect(html).toContain(">Voided</span>");
});

it("renders a useful empty state", async () => {
  const result = await loader(args());

  expect(result.payments).toEqual([]);

  const html = renderPage(result.payments);

  expect(html).toContain("Payments");
  expect(html).toContain(
    "Recorded payments across all invoices, including voided payments.",
  );

  expect(html).toContain("No payments yet");
  expect(html).toContain("Payments recorded on invoices will appear here.");

  expect(html).toContain('href="/invoices"');
  expect(html).toContain("View invoices");

  expect(html).not.toContain("<table");
});

it("maps permission denial to 403", async () => {
  context.set(currentUserContext, {
    ...fixture.admin,
    role: "unknown" as "admin",
  });

  await expect(loader(args())).rejects.toMatchObject({
    status: 403,
  });
});

it("requires authenticated user context", async () => {
  context = new RouterContextProvider();

  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  await expect(loader(args())).rejects.toThrow();
});
