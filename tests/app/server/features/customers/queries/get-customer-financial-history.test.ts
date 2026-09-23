import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as authorization from "../../../../../../app/server/auth/authorization/policies/can";
import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { invoices } from "../../../../../../app/server/db/schema/invoices";
import { payments } from "../../../../../../app/server/db/schema/payments";
import { getCustomerFinancialHistory } from "../../../../../../app/server/features/customers/queries/get-customer-financial-history.server";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { createInvoiceItem } from "../../../../../../app/server/features/invoices/services/create-invoice-item.server";
import { updateDraftInvoiceJobs } from "../../../../../../app/server/features/invoices/services/update-draft-invoice-jobs.server";
import { issueInvoice } from "../../../../../../app/server/features/invoices/services/issue-invoice.server";
import { voidInvoice } from "../../../../../../app/server/features/invoices/services/void-invoice.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { recordPayment } from "../../../../../../app/server/features/payments/services/record-payment.server";
import { voidPayment } from "../../../../../../app/server/features/payments/services/void-payment.server";
import { draftInvoiceFixture } from "../../../../../support/fixtures/draft-invoice";

let fixture: Awaited<ReturnType<typeof draftInvoiceFixture>>;
const history = (customerId = "customer") =>
  getCustomerFinancialHistory(env.DB, fixture.admin, customerId);

beforeEach(async () => {
  fixture = await draftInvoiceFixture();
  await createInvoiceItem(env.DB, fixture.admin, fixture.invoiceId, {
    jobId: fixture.jobId,
    description: "Mowing",
    amountCents: 6000,
  });
  await createInvoiceItem(env.DB, fixture.admin, fixture.invoiceId, {
    jobId: fixture.jobId,
    description: "Edging",
    amountCents: 4000,
  });
});
afterEach(() => vi.restoreAllMocks());

it("returns empty histories and zero totals for a customer without financial history", async () => {
  await createDb(env.DB)
    .insert(customers)
    .values({ id: "empty", name: "Empty", createdAt: 1, updatedAt: 1 });
  expect(await history("empty")).toEqual({
    invoices: [],
    payments: [],
    summary: {
      totalInvoicedCents: 0,
      paidCents: 0,
      outstandingCents: 0,
    },
  });
});

it("includes drafts but excludes them from total invoiced and outstanding", async () => {
  const result = await history();
  expect(result.invoices).toEqual([
    expect.objectContaining({
      id: fixture.invoiceId,
      status: "draft",
      invoiceNumber: null,
      totalCents: 10000,
    }),
  ]);
  expect(result.summary).toEqual({
    totalInvoicedCents: 0,
    paidCents: 0,
    outstandingCents: 0,
  });
  expect(result.payments).toEqual([]);
});

it.each([0, 2500, 10000])(
  "derives issued invoice balances with %i cents paid",
  async (amountCents) => {
    await issueInvoice(env.DB, fixture.admin, fixture.invoiceId, {
      dueDate: "2026-10-01",
    });
    if (amountCents)
      await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
        amountCents,
      });
    const result = await history();
    expect(result.summary).toEqual({
      totalInvoicedCents: 10000,
      paidCents: amountCents,
      outstandingCents: 10000 - amountCents,
    });
    expect(result.invoices).toEqual([
      expect.objectContaining({
        status: "issued",
        invoiceNumber: "INV-000001",
        totalCents: 10000,
        paidCents: amountCents,
        balanceCents: 10000 - amountCents,
      }),
    ]);
  },
);

it("keeps voided invoices in invoiced history but excludes their balance; retains active and voided payments", async () => {
  await issueInvoice(env.DB, fixture.admin, fixture.invoiceId, {
    dueDate: "2026-10-01",
  });
  const active = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 2500,
  });
  const voided = await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 1000,
  });
  await voidPayment(env.DB, fixture.admin, fixture.invoiceId, voided.id);
  expect((await history()).summary).toEqual({
    totalInvoicedCents: 10000,
    paidCents: 2500,
    outstandingCents: 7500,
  });
  await voidInvoice(env.DB, fixture.admin, fixture.invoiceId);
  const result = await history();
  expect(result.summary).toEqual({
    totalInvoicedCents: 10000,
    paidCents: 2500,
    outstandingCents: 0,
  });
  expect(result.invoices).toEqual([
    expect.objectContaining({
      status: "voided",
      paidCents: 2500,
      balanceCents: 7500,
    }),
  ]);
  expect(result.payments).toHaveLength(2);
  expect(result.payments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: active.id,
        invoiceId: fixture.invoiceId,
        invoiceNumber: "INV-000001",
        amountCents: 2500,
        voidedAt: null,
      }),
      expect.objectContaining({
        id: voided.id,
        amountCents: 1000,
        voidedAt: expect.any(Number),
      }),
    ]),
  );
});

it("does not multiply multi-job invoice totals by multiple payments", async () => {
  await updateDraftInvoiceJobs(env.DB, fixture.admin, fixture.invoiceId, {
    jobIds: [fixture.jobId, fixture.otherJobId],
  });
  await createInvoiceItem(env.DB, fixture.admin, fixture.invoiceId, {
    jobId: fixture.otherJobId,
    description: "Back lawn",
    amountCents: 5000,
  });
  await issueInvoice(env.DB, fixture.admin, fixture.invoiceId, {
    dueDate: "2026-10-01",
  });
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 1000,
  });
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 2000,
  });
  const result = await history();
  expect(result.invoices).toHaveLength(1);
  expect(result.invoices[0]).toMatchObject({
    totalCents: 15000,
    paidCents: 3000,
    balanceCents: 12000,
  });
  expect(result.summary).toEqual({
    totalInvoicedCents: 15000,
    paidCents: 3000,
    outstandingCents: 12000,
  });
});

it("isolates invoices, payments and all totals between customers", async () => {
  await issueInvoice(env.DB, fixture.admin, fixture.invoiceId, {
    dueDate: "2026-10-01",
  });
  await recordPayment(env.DB, fixture.admin, fixture.invoiceId, {
    amountCents: 2500,
  });
  await createDb(env.DB)
    .insert(customers)
    .values({ id: "other", name: "Other", createdAt: 1, updatedAt: 1 });
  const job = await createJob(env.DB, fixture.admin, {
    customerId: "other",
    name: "Other lawn",
    description: "Mow",
    scheduledDate: "2026-09-21",
  });
  const invoice = await createDraftInvoice(env.DB, fixture.admin, {
    jobIds: [job.id],
  });
  await createInvoiceItem(env.DB, fixture.admin, invoice.id, {
    jobId: job.id,
    description: "Other charge",
    amountCents: 800,
  });
  await issueInvoice(env.DB, fixture.admin, invoice.id, {
    dueDate: "2026-10-01",
  });
  const payment = await recordPayment(env.DB, fixture.admin, invoice.id, {
    amountCents: 300,
  });
  const other = await history("other");
  expect(other.invoices.map((row) => row.id)).toEqual([invoice.id]);
  expect(other.payments.map((row) => row.id)).toEqual([payment.id]);
  expect(other.summary).toEqual({
    totalInvoicedCents: 800,
    paidCents: 300,
    outstandingCents: 500,
  });
  const first = await history();
  expect(first.invoices.map((row) => row.id)).toEqual([fixture.invoiceId]);
  expect(first.payments).toHaveLength(1);
  expect(first.payments[0].invoiceId).toBe(fixture.invoiceId);
  expect(first.summary).toEqual({
    totalInvoicedCents: 10000,
    paidCents: 2500,
    outstandingCents: 7500,
  });
});

it("orders invoices by creation time then id, and payments by received time then id, newest first", async () => {
  const second = await createDraftInvoice(env.DB, fixture.admin, {
    jobIds: [fixture.otherJobId],
  });
  const db = createDb(env.DB);
  await db
    .update(invoices)
    .set({ createdAt: 100 })
    .where(eq(invoices.id, fixture.invoiceId));
  await db
    .update(invoices)
    .set({ createdAt: 200 })
    .where(eq(invoices.id, second.id));
  expect((await history()).invoices.map((row) => row.id)).toEqual([
    second.id,
    fixture.invoiceId,
  ]);
  await db
    .update(invoices)
    .set({ createdAt: 200 })
    .where(eq(invoices.id, fixture.invoiceId));
  expect((await history()).invoices.map((row) => row.id)).toEqual(
    [second.id, fixture.invoiceId].sort().reverse(),
  );
  await issueInvoice(env.DB, fixture.admin, fixture.invoiceId, {
    dueDate: "2026-10-01",
  });
  await db.insert(payments).values([
    {
      id: "z-old",
      invoiceId: fixture.invoiceId,
      amountCents: 100,
      receivedAt: 100,
      createdAt: 900,
    },
    {
      id: "a-new",
      invoiceId: fixture.invoiceId,
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
      voidedAt: 300,
    },
  ]);
  expect((await history()).payments.map((row) => row.id)).toEqual([
    "b-new",
    "a-new",
    "z-old",
  ]);
});

it.each(["admin", "operator"] as const)(
  "allows financial history reads for %s",
  async (role) => {
    expect(
      (
        await getCustomerFinancialHistory(
          env.DB,
          { ...fixture.admin, role },
          "customer",
        )
      ).invoices,
    ).toHaveLength(1);
  },
);

it.each(["customers.read", "invoices.read", "payments.read"] as const)(
  "requires %s before reading financial data",
  async (denied) => {
    const original = authorization.can;
    vi.spyOn(authorization, "can").mockImplementation(
      (user, permission) => permission !== denied && original(user, permission),
    );
    await expect(history()).rejects.toBeInstanceOf(PermissionDeniedError);
  },
);
