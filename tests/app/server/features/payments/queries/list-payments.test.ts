import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, expect, it } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { payments } from "../../../../../../app/server/db/schema/payments";
import { listPayments } from "../../../../../../app/server/features/payments/queries/list-payments.server";
import { recordPayment } from "../../../../../../app/server/features/payments/services/record-payment.server";
import { voidPayment } from "../../../../../../app/server/features/payments/services/void-payment.server";
import { voidInvoice } from "../../../../../../app/server/features/invoices/services/void-invoice.server";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { issueInvoice } from "../../../../../../app/server/features/invoices/services/issue-invoice.server";
import { issuedInvoiceFixture } from "../../../../../support/fixtures/issued-invoice";

let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;

beforeEach(async () => {
  fixture = await issuedInvoiceFixture();
});

it.each(["admin", "operator"] as const)(
  "returns active payments with amount, invoice and customer context for %s",
  async (role) => {
    const { id } = await recordPayment(
      env.DB,
      fixture.admin,
      fixture.invoiceId,
      {
        amountCents: 1234,
      },
    );
    expect(await listPayments(env.DB, { ...fixture.admin, role })).toEqual([
      {
        id,
        invoiceId: fixture.invoiceId,
        invoiceNumber: "INV-000001",
        customerId: "customer",
        customerName: "John Smith",
        amountCents: 1234,
        receivedAt: expect.any(Number),
        voidedAt: null,
      },
    ]);
  },
);

it("retains both active and voided payments after their invoice is voided", async () => {
  const active = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 1000,
  });
  const voided = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 2000,
  });
  await voidPayment(env.DB, fixture.admin, fixture.invoiceId, voided.id);
  await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);

  const result = await listPayments(env.DB, fixture.admin);
  expect(result).toHaveLength(2);
  expect(result).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: active.id,
        amountCents: 1000,
        voidedAt: null,
      }),
      expect.objectContaining({
        id: voided.id,
        amountCents: 2000,
        voidedAt: expect.any(Number),
      }),
    ]),
  );
  expect(
    result.every((payment) => payment.invoiceNumber === "INV-000001"),
  ).toBe(true);
});

it("orders across invoices by received time descending, then id descending", async () => {
  const second = await createDraftInvoice(env.DB, fixture.admin, {
    jobIds: [fixture.otherJobId],
  });
  await issueInvoice(env.DB, fixture.admin, second.id, {
    dueDate: "2026-10-01",
  });
  await createDb(env.DB)
    .insert(payments)
    .values([
      {
        id: "z-old",
        invoiceId: fixture.invoiceId,
        amountCents: 100,
        receivedAt: 100,
        createdAt: 900,
      },
      {
        id: "a-new",
        invoiceId: second.id,
        amountCents: 200,
        receivedAt: 200,
        createdAt: 200,
      },
      {
        id: "b-new",
        invoiceId: fixture.invoiceId,
        amountCents: 300,
        receivedAt: 200,
        createdAt: 100,
      },
    ]);
  const result = await listPayments(env.DB, fixture.admin);
  expect(result.map((payment) => payment.id)).toEqual([
    "b-new",
    "a-new",
    "z-old",
  ]);
  expect(result[1]).toMatchObject({
    invoiceId: second.id,
    invoiceNumber: "INV-000002",
  });
});

it("returns an empty list when there are no payments", async () => {
  expect(await listPayments(env.DB, fixture.admin)).toEqual([]);
});

it("requires payment read permission", async () => {
  await expect(
    listPayments(env.DB, { ...fixture.admin, role: "unknown" as "admin" }),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});

it("keeps the original received time when a payment is voided", async () => {
  const { id } = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 100,
  });
  await createDb(env.DB)
    .update(payments)
    .set({ receivedAt: 100 })
    .where(eq(payments.id, id));
  await voidPayment(env.DB, fixture.admin, fixture.invoiceId, id);
  expect(await listPayments(env.DB, fixture.admin)).toEqual([
    expect.objectContaining({
      id,
      receivedAt: 100,
      voidedAt: expect.any(Number),
    }),
  ]);
});
