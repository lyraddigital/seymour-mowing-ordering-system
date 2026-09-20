import { env } from "cloudflare:workers";
import { RouterContextProvider } from "react-router";
import { beforeEach, expect, it } from "vitest";
import { issuedInvoiceFixture } from "../../support/fixtures/issued-invoice";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { recordPayment } from "../../../app/server/features/payments/services/record-payment.server";
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import { createDraftInvoice } from "../../../app/server/features/invoices/services/create-draft-invoice.server";
import { action } from "../../../app/routes/invoices.$invoiceId.payments.$paymentId.void";
let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;
let context: RouterContextProvider;
beforeEach(async () => {
  fixture = await issuedInvoiceFixture();
  context = new RouterContextProvider();
  context.set(currentUserContext, fixture.admin);
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
});

function args(invoiceId: string, paymentId: string) {
  return {
    context,
    params: { invoiceId, paymentId },
    request: new Request("https://example.test/invoices", { method: "POST" }),
    url: new URL("https://example.test/invoices"),
    pattern: "/invoices/:invoiceId/payments/:paymentId/void",
  };
}
it.each(["issued", "voided"])(
  "voids a payment on a %s invoice and redirects",
  async (status) => {
    const { id } = await recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      { amountCents: 1000 },
    );
    if (status === "voided")
      await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);
    const result = await action(args(fixture.invoiceId, id));
    expect(result.status).toBe(302);
    expect(result.headers.get("Location")).toBe(
      `/invoices/${fixture.invoiceId}`,
    );
    await expect(action(args(fixture.invoiceId, id))).rejects.toMatchObject({
      status: 409,
    });
  },
);
it("returns 404 for nested ownership mismatch", async () => {
  const payment = await recordPayment(
    env.DB,
    fixture.admin,
    fixture.invoiceId,
    { amountCents: 1000 },
  );
  const { id } = await createDraftInvoice(env.DB, fixture.admin, {
    jobIds: [fixture.otherJobId],
  });
  await expect(action(args(id, payment.id))).rejects.toMatchObject({
    status: 404,
  });
});
it("returns 404 for missing invoice or payment", async () => {
  await expect(action(args("missing", "missing"))).rejects.toMatchObject({
    status: 404,
  });
  await expect(
    action(args(fixture.invoiceId, "missing")),
  ).rejects.toMatchObject({ status: 404 });
});
it("returns 403 without management permission", async () => {
  context.set(currentUserContext, { ...fixture.admin, role: "operator" });
  await expect(
    action(args(fixture.invoiceId, "missing")),
  ).rejects.toMatchObject({ status: 403 });
});
