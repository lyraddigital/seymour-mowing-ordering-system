import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { payments } from "../../../../../../app/server/db/schema/payments";
import { InvoiceNotFoundError } from "../../../../../../app/server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../../../../../../app/server/features/invoices/errors/invoice-state-conflict-error";
import { getInvoiceById } from "../../../../../../app/server/features/invoices/queries/get-invoice-by-id.server";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { voidInvoice } from "../../../../../../app/server/features/invoices/services/void-invoice.server";
import { PaymentOverpaymentError } from "../../../../../../app/server/features/payments/errors/payment-overpayment-error";
import { PaymentValidationError } from "../../../../../../app/server/features/payments/errors/payment-validation-error";
import { recordPayment } from "../../../../../../app/server/features/payments/services/record-payment.server";
import { voidPayment } from "../../../../../../app/server/features/payments/services/void-payment.server";
import { issuedInvoiceFixture } from "../../../../../support/fixtures/issued-invoice";

const now = new Date("2026-09-25T02:00:00.000Z");
let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;

beforeEach(async () => {
  fixture = await issuedInvoiceFixture();
});

it("records the bank payment date and server creation timestamp", async () => {
  const { id } = await recordPayment(
    env.DB,
    fixture.admin,
    fixture.invoiceId,
    { amountCents: 1234, paymentDate: "2026-09-24" },
    now,
  );

  const [payment] = await createDb(env.DB).select().from(payments);

  expect(payment).toEqual({
    id,
    invoiceId: fixture.invoiceId,
    amountCents: 1234,
    paymentDate: "2026-09-24",
    voidedAt: null,
    createdAt: now.getTime(),
  });
});

it("accepts multiple payments including an exact final balance", async () => {
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 3000,
    paymentDate: "2026-09-23",
  });
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 7000,
    paymentDate: "2026-09-24",
  });

  const result = await getInvoiceById(env.DB, fixture.admin, fixture.invoiceId);
  expect(result!.invoice).toMatchObject({
    totalCents: 10000,
    paidCents: 10000,
    balanceCents: 0,
  });
  expect(result!.payments).toHaveLength(2);

  await expect(
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
      amountCents: 1,
      paymentDate: "2026-09-24",
    }),
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
    recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      { amountCents, paymentDate: "2026-09-24" },
      now,
    ),
  ).rejects.toMatchObject({
    fieldErrors: { amount: "Enter a valid payment amount greater than zero." },
  });
  expect(await createDb(env.DB).select().from(payments)).toEqual([]);
});

it.each([
  ["", "Enter a payment date."],
  ["not-a-date", "Enter a valid payment date."],
  ["25/09/2026", "Enter a valid payment date."],
  ["2026-02-30", "Enter a valid payment date."],
  ["0000-01-01", "Enter a valid payment date."],
] as const)("rejects invalid payment date %s", async (paymentDate, message) => {
  await expect(
    recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      { amountCents: 1000, paymentDate },
      now,
    ),
  ).rejects.toMatchObject({ fieldErrors: { paymentDate: message } });
  expect(await createDb(env.DB).select().from(payments)).toEqual([]);
});

it("rejects a payment date in the future", async () => {
  await expect(
    recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      { amountCents: 1000, paymentDate: "2026-09-26" },
      now,
    ),
  ).rejects.toMatchObject({
    fieldErrors: { paymentDate: "Payment date cannot be in the future." },
  });
});

it("uses the Melbourne calendar date when validating future payments", async () => {
  await expect(
    recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      { amountCents: 1000, paymentDate: "2026-09-25" },
      new Date("2026-09-24T16:00:00.000Z"),
    ),
  ).resolves.toEqual({ id: expect.any(String) });
});

it("rejects overpayment without writing another payment", async () => {
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 7000,
    paymentDate: "2026-09-23",
  });
  await expect(
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
      amountCents: 3001,
      paymentDate: "2026-09-24",
    }),
  ).rejects.toBeInstanceOf(PaymentOverpaymentError);
  expect(await createDb(env.DB).select().from(payments)).toHaveLength(1);
});

it("prevents concurrent payments exceeding the balance", async () => {
  const results = await Promise.allSettled([
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
      amountCents: 6000,
      paymentDate: "2026-09-24",
    }),
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
      amountCents: 6000,
      paymentDate: "2026-09-24",
    }),
  ]);
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  expect(
    results.find((result) => result.status === "rejected")?.reason,
  ).toBeInstanceOf(PaymentOverpaymentError);
  expect(
    (await getInvoiceById(env.DB, fixture.admin, fixture.invoiceId))!.invoice
      .paidCents,
  ).toBe(6000);
});

it("does not count voided payments when checking the balance", async () => {
  const { id } = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 10000,
    paymentDate: "2026-09-23",
  });
  await voidPayment(env.DB, fixture.admin, fixture.invoiceId, id);
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 10000,
    paymentDate: "2026-09-24",
  });
  expect(await createDb(env.DB).select().from(payments)).toHaveLength(2);
});

it("rejects draft invoices", async () => {
  const { id } = await createDraftInvoice(env.DB, fixture.admin, {
    jobIds: [fixture.otherJobId],
  });
  await expect(
    recordPayment(env.DB, fixture.admin, id, {
      amountCents: 1,
      paymentDate: "2026-09-24",
    }),
  ).rejects.toBeInstanceOf(InvoiceStateConflictError);
});

it("rejects voided invoices", async () => {
  await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);
  await expect(
    recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
      amountCents: 1,
      paymentDate: "2026-09-24",
    }),
  ).rejects.toBeInstanceOf(InvoiceStateConflictError);
});

it("requires management permission", async () => {
  await expect(
    recordPayment(
      env.DB,
      { ...fixture.admin, role: "operator" },
      fixture.invoiceId,
      { amountCents: 1, paymentDate: "2026-09-24" },
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});

it("rejects a missing invoice", async () => {
  await expect(
    recordPayment(env.DB, fixture.admin, "missing", {
      amountCents: 1,
      paymentDate: "2026-09-24",
    }),
  ).rejects.toBeInstanceOf(InvoiceNotFoundError);
});

it("throws PaymentValidationError for invalid payment details", async () => {
  await expect(
    recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      { amountCents: 0, paymentDate: "" },
      now,
    ),
  ).rejects.toBeInstanceOf(PaymentValidationError);
});
