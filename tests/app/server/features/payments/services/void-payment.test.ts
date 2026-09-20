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
import { PaymentNotFoundError } from "../../../../../../app/server/features/payments/errors/payment-not-found-error";
import { PaymentStateConflictError } from "../../../../../../app/server/features/payments/errors/payment-state-conflict-error";
import { isJobInvoiceable } from "../../../../../../app/server/features/invoices/queries/is-job-invoiceable.server";
let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;
beforeEach(async () => {
  fixture = await issuedInvoiceFixture();
});

it("voids once, preserves the original record and restores the balance", async () => {
  const { id } = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 2500,
  });
  const [before] = await createDb(env.DB).select().from(payments);
  await voidPayment(env.DB, fixture.admin, fixture.invoiceId, id);
  const [after] = await createDb(env.DB).select().from(payments);
  expect(after).toEqual({ ...before, voidedAt: expect.any(Number) });
  const result = await getInvoiceById(env.DB, fixture.admin, fixture.invoiceId);
  expect(result!.invoice).toMatchObject({ paidCents: 0, balanceCents: 10000 });
  expect(result!.payments).toEqual([after]);
  await expect(
    voidPayment(env.DB, fixture.admin, fixture.invoiceId, id),
  ).rejects.toBeInstanceOf(PaymentStateConflictError);
  expect(await createDb(env.DB).select().from(payments)).toEqual([after]);
});
it("preserves active and voided payments through invoice void, then allows explicit payment void", async () => {
  const active = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 2500,
  });
  const inactive = await recordPayment(
    env.DB,
    fixture.admin,
    fixture.invoiceId,
    { amountCents: 1000 },
  );
  await voidPayment(env.DB, fixture.admin, fixture.invoiceId, inactive.id);
  const before = await createDb(env.DB).select().from(payments);
  await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);
  expect(await createDb(env.DB).select().from(payments)).toEqual(before);
  const result = await getInvoiceById(env.DB, fixture.admin, fixture.invoiceId);
  expect(result!.invoice).toMatchObject({
    status: "voided",
    paidCents: 2500,
    balanceCents: 7500,
  });
  expect(result!.payments).toHaveLength(2);
  expect(
    result!.payments.find((payment) => payment.id === active.id),
  ).toMatchObject({ amountCents: 2500, voidedAt: null });
  expect(await isJobInvoiceable(env.DB, fixture.admin, fixture.jobId)).toBe(
    true,
  );
  await expect(
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, { amountCents: 1 }),
  ).rejects.toThrow("issued invoices");
  await voidPayment(env.DB, fixture.admin, fixture.invoiceId, active.id);
  const after = await getInvoiceById(env.DB, fixture.admin, fixture.invoiceId);
  expect(after!.payments).toHaveLength(2);
  expect(after!.payments.every((payment) => payment.voidedAt !== null)).toBe(
    true,
  );
  expect(after!.invoice).toMatchObject({ paidCents: 0, balanceCents: 10000 });
});
it("rejects a payment through a different invoice", async () => {
  const { id: paymentId } = await recordPayment(
    env.DB,
    fixture.admin,
    fixture.invoiceId,
    { amountCents: 100 },
  );
  const { id } = await createDraftInvoice(env.DB, fixture.admin, {
    jobIds: [fixture.otherJobId],
  });
  await expect(
    voidPayment(env.DB, fixture.admin, id, paymentId),
  ).rejects.toBeInstanceOf(PaymentNotFoundError);
  expect(
    (await createDb(env.DB).select().from(payments))[0].voidedAt,
  ).toBeNull();
});
it("rejects a missing payment", async () => {
  await expect(
    voidPayment(env.DB, fixture.admin, fixture.invoiceId, "missing"),
  ).rejects.toBeInstanceOf(PaymentNotFoundError);
});
it("rejects a missing invoice", async () => {
  await expect(
    voidPayment(env.DB, fixture.admin, "missing", "missing"),
  ).rejects.toBeInstanceOf(InvoiceNotFoundError);
});
it("requires management permission", async () => {
  const { id } = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 100,
  });
  await expect(
    voidPayment(
      env.DB,
      { ...fixture.admin, role: "operator" },
      fixture.invoiceId,
      id,
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
it("only one concurrent void succeeds", async () => {
  const { id } = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 100,
  });
  const results = await Promise.allSettled([
    voidPayment(env.DB, fixture.admin, fixture.invoiceId, id),
    voidPayment(env.DB, fixture.admin, fixture.invoiceId, id),
  ]);
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  expect(
    results.find((result) => result.status === "rejected")?.reason,
  ).toBeInstanceOf(PaymentStateConflictError);
});
