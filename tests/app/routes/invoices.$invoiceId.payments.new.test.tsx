import { env } from "cloudflare:workers";
import { RouterContextProvider } from "react-router";
import { beforeEach, expect, it } from "vitest";
import { issuedInvoiceFixture } from "../../support/fixtures/issued-invoice";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { recordPayment } from "../../../app/server/features/payments/services/record-payment.server";
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import { createDraftInvoice } from "../../../app/server/features/invoices/services/create-draft-invoice.server";
import {
  action,
  loader,
} from "../../../app/routes/invoices.$invoiceId.payments.new";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { payments } from "../../../app/server/db/schema/payments";
import RecordPaymentPage from "../../../app/ui/features/invoices/pages/record-payment-page/record-payment-page";
import { createMemoryRouter, RouterProvider } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;
let context: RouterContextProvider;
beforeEach(async () => {
  fixture = await issuedInvoiceFixture();
  context = new RouterContextProvider();
  context.set(currentUserContext, fixture.admin);
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
});

function args(invoiceId: string = fixture.invoiceId, amount = "25.50") {
  return {
    context,
    params: { invoiceId },
    request: new Request("https://example.test/invoices", {
      method: "POST",
      body: new URLSearchParams({ amount, receivedAt: "1", voidedAt: "1" }),
    }),
    url: new URL("https://example.test/invoices"),
    pattern: "/invoices/:invoiceId/payments/new",
  };
}
it("loads invoice context and renders only an amount field", async () => {
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 2500,
  });
  const result = await loader(args());
  expect(result.invoice).toMatchObject({
    invoiceNumber: expect.any(String),
    customerName: "John Smith",
    totalCents: 10000,
    paidCents: 2500,
    balanceCents: 7500,
  });
  const router = createMemoryRouter([
    { path: "/", element: <RecordPaymentPage {...result} /> },
  ]);
  const html = renderToStaticMarkup(<RouterProvider router={router} />);
  expect(html).toContain(result.invoice.invoiceNumber!);
  expect(html).toContain("John Smith");
  for (const amount of ["$100.00", "$25.00", "$75.00"])
    expect(html).toContain(amount);
  expect(html.match(/<input/g)).toHaveLength(1);
  expect(html).toContain('name="amount"');
});
it.each([
  ["25.50", 2550],
  ["25.5", 2550],
  ["100", 10000],
])("records %s and redirects", async (amount, cents) => {
  const before = Date.now();
  const result = await action(args(fixture.invoiceId, String(amount)));
  expect(result).toBeInstanceOf(Response);
  expect((result as Response).status).toBe(302);
  expect((result as Response).headers.get("Location")).toBe(
    `/invoices/${fixture.invoiceId}`,
  );
  const [payment] = await createDb(env.DB).select().from(payments);
  expect(payment.amountCents).toBe(cents);
  expect(payment.receivedAt).toBeGreaterThanOrEqual(before);
  expect(payment.voidedAt).toBeNull();
});
it.each(["", "0", "-1", "1.234", "abc", "$5", "1e2", "9007199254740992"])(
  "returns validation data for %s",
  async (amount) => {
    const result = await action(args(fixture.invoiceId, amount));
    if (result instanceof Response) throw new Error("Expected validation data");
    expect(result.init?.status).toBe(400);
    expect(result.data.values.amount).toBe(amount);
    expect(result.data.errorMessage).toContain("valid payment amount");
  },
);
it("returns a useful overpayment error", async () => {
  const result = await action(args(fixture.invoiceId, "100.01"));
  if (result instanceof Response) throw new Error("Expected validation data");
  expect(result.init?.status).toBe(400);
  expect(result.data.errorMessage).toContain("remaining invoice balance");
  const props = await loader(args());
  const router = createMemoryRouter([
    { path: "/", element: <RecordPaymentPage {...props} {...result.data} /> },
  ]);
  const html = renderToStaticMarkup(<RouterProvider router={router} />);
  expect(html).toContain('value="100.01"');
  expect(html).toContain('role="alert"');
});
it.each(["draft", "voided"])(
  "rejects %s invoice loader and action",
  async (status) => {
    let id: string = fixture.invoiceId;
    if (status === "draft")
      ({ id } = await createDraftInvoice(env.DB, fixture.admin, {
        jobIds: [fixture.otherJobId],
      }));
    else await voidInvoice(env.DB, fixture.admin, id);
    await expect(loader(args(id))).rejects.toMatchObject({ status: 409 });
    await expect(action(args(id))).rejects.toMatchObject({ status: 409 });
  },
);
it("rejects the form loader for a fully-paid invoice", async () => {
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 10000,
  });
  await expect(loader(args())).rejects.toMatchObject({ status: 409 });
});
it("returns 403 for a non-managing user", async () => {
  context.set(currentUserContext, { ...fixture.admin, role: "operator" });
  await expect(loader(args())).rejects.toMatchObject({ status: 403 });
  await expect(action(args())).rejects.toMatchObject({ status: 403 });
});
it("returns 404 for a missing invoice", async () => {
  await expect(loader(args("missing"))).rejects.toMatchObject({ status: 404 });
  await expect(action(args("missing"))).rejects.toMatchObject({ status: 404 });
});
