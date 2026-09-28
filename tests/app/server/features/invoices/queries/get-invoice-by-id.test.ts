import { completeInvoiceJobs } from "../../../../../support/fixtures/complete-invoice-jobs";
import { voidInvoice } from "../../../../../../app/server/features/invoices/services/void-invoice.server";
import { issueInvoice } from "../../../../../../app/server/features/invoices/services/issue-invoice.server";
import { voidPayment } from "../../../../../../app/server/features/payments/services/void-payment.server";
import { recordPayment } from "../../../../../../app/server/features/payments/services/record-payment.server";
import { payments } from "../../../../../../app/server/db/schema/payments";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, expect, it } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { invoiceItems } from "../../../../../../app/server/db/schema/invoice-items";
import { invoiceJobs } from "../../../../../../app/server/db/schema/invoice-jobs";
import { invoices } from "../../../../../../app/server/db/schema/invoices";
import { jobItems } from "../../../../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { getInvoiceById } from "../../../../../../app/server/features/invoices/queries/get-invoice-by-id.server";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { completeJob } from "../../../../../../app/server/features/jobs/services/complete-job.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const admin = internalUser();

let firstJobId: string;
let secondJobId: string;

beforeEach(async () => {
  const db = createDb(env.DB);

  await db.delete(payments);
  await db.delete(invoiceItems);
  await db.delete(invoiceJobs);
  await db.delete(invoices);
  await db.delete(jobItems);
  await db.delete(jobStatusHistory);
  await db.delete(jobs);
  await db.delete(customers);
  await db.delete(users);

  await db.insert(users).values(admin);

  await db.insert(customers).values({
    id: "customer",
    name: "John Smith",
    createdAt: 1,
    updatedAt: 1,
  });

  ({ id: firstJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-17",
  }));

  ({ id: secondJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Back lawn",
    description: "Mow back lawn",
    scheduledDate: "2026-09-18",
  }));
});

it("returns invoice detail with multiple jobs", async () => {
  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const result = await getInvoiceById(env.DB, admin, invoiceId);

  expect(result).toEqual({
    payments: [],
    invoice: expect.objectContaining({
      id: invoiceId,
      customerId: "customer",
      customerName: "John Smith",
      invoiceNumber: null,
      status: "draft",
      totalCents: 0,
      jobs: [
        expect.objectContaining({
          id: firstJobId,
          name: "Front lawn",
          scheduledDate: "2026-09-17",
          completedAt: expect.any(Number),
        }),
        expect.objectContaining({
          id: secondJobId,
          name: "Back lawn",
          scheduledDate: "2026-09-18",
          completedAt: expect.any(Number),
        }),
      ],
    }),
    items: expect.arrayContaining([
      expect.objectContaining({
        jobId: firstJobId,
        description: "Front lawn",
        quantity: 1,
        unitPriceCents: 0,
        amountCents: 0,
      }),
      expect.objectContaining({
        jobId: secondJobId,
        description: "Back lawn",
        quantity: 1,
        unitPriceCents: 0,
        amountCents: 0,
      }),
    ]),
  });
  expect(result?.items).toHaveLength(2);
});

it("returns invoice items with their source jobs", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  await createJobItem(env.DB, admin, secondJobId, {
    description: "Back lawn mow",
    amountCents: 3500,
  });

  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const result = await getInvoiceById(env.DB, admin, invoiceId);

  expect(result?.items).toHaveLength(4);

  expect(result?.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        invoiceId,
        jobId: firstJobId,
        description: "Front lawn mow",
        quantity: 1,
        unitPriceCents: 4500,
        amountCents: 4500,
      }),
      expect.objectContaining({
        invoiceId,
        jobId: secondJobId,
        description: "Back lawn mow",
        quantity: 1,
        unitPriceCents: 3500,
        amountCents: 3500,
      }),
    ]),
  );
});

it("derives the invoice total across all invoice items", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  await createJobItem(env.DB, admin, secondJobId, {
    description: "Back lawn mow",
    amountCents: 3500,
  });

  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const result = await getInvoiceById(env.DB, admin, invoiceId);

  expect(result?.invoice.totalCents).toBe(8000);
});

it("returns jobs in scheduled-date order", async () => {
  await completeInvoiceJobs(admin, [secondJobId, firstJobId]);
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [secondJobId, firstJobId],
  });

  const result = await getInvoiceById(env.DB, admin, invoiceId);

  expect(result?.invoice.jobs.map((job) => job.id)).toEqual([
    firstJobId,
    secondJobId,
  ]);
});

it("keeps billing lines and completion dates independent from later job changes", async () => {
  const { id: chargeId } = await createJobItem(env.DB, admin, firstJobId, {
    description: "Green waste disposal",
    amountCents: 2345,
  });
  await completeJob(env.DB, admin, firstJobId, 12_300);

  const completedHistory = await createDb(env.DB)
    .select()
    .from(jobStatusHistory)
    .where(eq(jobStatusHistory.jobId, firstJobId));
  const completedAt = Math.max(
    ...completedHistory
      .filter((entry) => entry.status === "completed")
      .map((entry) => entry.createdAt),
  );

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const db = createDb(env.DB);
  await db
    .update(jobs)
    .set({
      name: "Changed job name",
      description: "Changed job description",
      servicePriceCents: 99_999,
    })
    .where(eq(jobs.id, firstJobId));
  await db
    .update(jobItems)
    .set({ description: "Changed charge", amountCents: 8888 })
    .where(eq(jobItems.id, chargeId));
  await db.insert(jobStatusHistory).values({
    id: "later-status",
    jobId: firstJobId,
    status: "in_progress",
    createdByUserId: admin.id,
    createdAt: completedAt + 1000,
  });

  const result = await getInvoiceById(env.DB, admin, invoiceId);

  expect(result?.invoice.jobs[0].completedAt).toBe(completedAt);
  expect(result?.invoice.totalCents).toBe(14_645);
  expect(result?.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        description: "Front lawn",
        quantity: 1,
        unitPriceCents: 12_300,
        amountCents: 12_300,
      }),
      expect.objectContaining({
        description: "Green waste disposal",
        quantity: 1,
        unitPriceCents: 2345,
        amountCents: 2345,
      }),
    ]),
  );
});

it("returns null for a missing invoice", async () => {
  expect(await getInvoiceById(env.DB, admin, "missing")).toBeNull();
});

it("requires invoice read permission", async () => {
  await expect(
    getInvoiceById(
      env.DB,
      {
        ...admin,
        role: "unknown" as "admin",
      },
      "invoice",
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});

it("derives totals without multiplying item/payment rows and keeps ordered history after invoice void", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Mow",
    amountCents: 6000,
  });
  await createJobItem(env.DB, admin, secondJobId, {
    description: "Edge",
    amountCents: 4000,
  });
  await completeInvoiceJobs(admin, [firstJobId, secondJobId]);
  const { id } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });
  await issueInvoice(env.DB, admin, id, {
    dueDate: "2026-10-01",
  });
  const first = await recordPayment(env.DB, admin, id, {
    amountCents: 1000,
    paymentDate: "2026-09-24",
  });
  await recordPayment(env.DB, admin, id, {
    amountCents: 2000,
    paymentDate: "2026-09-24",
  });
  await recordPayment(env.DB, admin, id, {
    amountCents: 3000,
    paymentDate: "2026-09-24",
  });
  await voidPayment(env.DB, admin, id, first.id);
  let result = await getInvoiceById(env.DB, admin, id);
  expect(result!.invoice).toMatchObject({
    totalCents: 10000,
    paidCents: 5000,
    balanceCents: 5000,
  });
  expect(result!.payments).toHaveLength(3);
  const sorted = [...result!.payments].sort(
    (a, b) =>
      a.paymentDate.localeCompare(b.paymentDate) ||
      a.createdAt - b.createdAt ||
      a.id.localeCompare(b.id),
  );
  expect(result!.payments).toEqual(sorted);
  const history = result!.payments;
  await voidInvoice(env.DB, admin, id);
  result = await getInvoiceById(env.DB, admin, id);
  expect(result!.payments).toEqual(history);
  expect(result!.invoice).toMatchObject({
    totalCents: 10000,
    paidCents: 5000,
    balanceCents: 5000,
  });
});
