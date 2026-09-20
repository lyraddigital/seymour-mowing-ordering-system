import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { issuedInvoiceFixture } from "../../../../../support/fixtures/issued-invoice";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { payments } from "../../../../../../app/server/db/schema/payments";
import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { InvoiceNotFoundError } from "../../../../../../app/server/features/invoices/errors/invoice-not-found-error";
import { recordPayment } from "../../../../../../app/server/features/payments/services/record-payment.server";
import { voidPayment } from "../../../../../../app/server/features/payments/services/void-payment.server";
import { getInvoiceById } from "../../../../../../app/server/features/invoices/queries/get-invoice-by-id.server";
import { voidInvoice } from "../../../../../../app/server/features/invoices/services/void-invoice.server";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { InvoiceStateConflictError } from "../../../../../../app/server/features/invoices/errors/invoice-state-conflict-error";
import { PaymentValidationError } from "../../../../../../app/server/features/payments/errors/payment-validation-error";
import { PaymentOverpaymentError } from "../../../../../../app/server/features/payments/errors/payment-overpayment-error";
let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;
beforeEach(async () => {
  fixture = await issuedInvoiceFixture();
});

it("records integer cents and server timestamps on an issued invoice", async () => {
  const start = Date.now();
  const input = { amountCents: 1234, receivedAt: 1, voidedAt: 1 };
  const { id } = await recordPayment(
    env.DB,
    fixture.admin,
    fixture.invoiceId,
    input,
  );
  const [payment] = await createDb(env.DB).select().from(payments);
  expect(payment).toMatchObject({
    id,
    invoiceId: fixture.invoiceId,
    amountCents: 1234,
    voidedAt: null,
  });
  expect(payment.receivedAt).toBeGreaterThanOrEqual(start);
  expect(payment.receivedAt).toBeLessThanOrEqual(Date.now());
  expect(payment.createdAt).toBe(payment.receivedAt);
});
it("accepts multiple payments including an exact final balance", async () => {
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 3000,
  });
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 7000,
  });
  const result = await getInvoiceById(env.DB, fixture.admin, fixture.invoiceId);
  expect(result!.invoice).toMatchObject({
    totalCents: 10000,
    paidCents: 10000,
    balanceCents: 0,
  });
  expect(result!.payments).toHaveLength(2);
  await expect(
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, { amountCents: 1 }),
  ).rejects.toBeInstanceOf(PaymentOverpaymentError);
});
it.each([
  0,
  -1,
  1.5,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.MAX_SAFE_INTEGER + 1,
])("rejects invalid amount %s", async (amountCents) => {
  await expect(
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, { amountCents }),
  ).rejects.toBeInstanceOf(PaymentValidationError);
  expect(await createDb(env.DB).select().from(payments)).toEqual([]);
});
it("rejects overpayment without writing a payment", async () => {
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 7000,
  });
  await expect(
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
      amountCents: 3001,
    }),
  ).rejects.toBeInstanceOf(PaymentOverpaymentError);
  expect(await createDb(env.DB).select().from(payments)).toHaveLength(1);
});
it("prevents concurrent payments exceeding the balance", async () => {
  const results = await Promise.allSettled([
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
      amountCents: 6000,
    }),
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
      amountCents: 6000,
    }),
  ]);
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  const rejected = results.find((result) => result.status === "rejected");
  expect(rejected?.reason).toBeInstanceOf(PaymentOverpaymentError);
  expect(
    (await getInvoiceById(env.DB, fixture.admin, fixture.invoiceId))!.invoice
      .paidCents,
  ).toBe(6000);
});
it("does not count voided payments when checking the balance", async () => {
  const { id } = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 10000,
  });
  await voidPayment(env.DB, fixture.admin, fixture.invoiceId, id);
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 10000,
  });
  expect(await createDb(env.DB).select().from(payments)).toHaveLength(2);
});
it("rejects draft invoices", async () => {
  const { id } = await createDraftInvoice(env.DB, fixture.admin, {
    jobIds: [fixture.otherJobId],
  });
  await expect(
    recordPayment(env.DB, fixture.admin, id, { amountCents: 1 }),
  ).rejects.toBeInstanceOf(InvoiceStateConflictError);
});
it("rejects voided invoices", async () => {
  await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);
  await expect(
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, { amountCents: 1 }),
  ).rejects.toBeInstanceOf(InvoiceStateConflictError);
});
it("requires management permission", async () => {
  await expect(
    recordPayment(
      env.DB,
      { ...fixture.admin, role: "operator" },
      fixture.invoiceId,
      { amountCents: 1 },
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
it("rejects a missing invoice", async () => {
  await expect(
    recordPayment(env.DB, fixture.admin, "missing", { amountCents: 1 }),
  ).rejects.toBeInstanceOf(InvoiceNotFoundError);
});
