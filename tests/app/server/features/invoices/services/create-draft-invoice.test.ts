import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, expect, it } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { invoiceItems } from "../../../../../../app/server/db/schema/invoice-items";
import { invoices } from "../../../../../../app/server/db/schema/invoices";
import { jobItems } from "../../../../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { JobNotFoundError } from "../../../../../../app/server/features/jobs/errors/job-not-found-error";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const admin = internalUser();

let jobId: string;

beforeEach(async () => {
  const db = createDb(env.DB);

  await db.delete(invoiceItems);
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

  ({ id: jobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front & Back Lawn Mow",
    description: "Mow lawns",
    scheduledDate: "2026-09-17",
  }));
});

it("creates a draft invoice for a job", async () => {
  const result = await createDraftInvoice(env.DB, admin, jobId);

  const invoice = await createDb(env.DB)
    .select()
    .from(invoices)
    .where(eq(invoices.id, result.id))
    .get();

  expect(invoice).toMatchObject({
    id: result.id,
    jobId,
    customerId: "customer",
    invoiceNumber: null,
    status: "draft",
    issuedAt: null,
    voidedAt: null,
  });

  expect(invoice?.createdAt).toEqual(expect.any(Number));
  expect(invoice?.updatedAt).toEqual(expect.any(Number));
});

it("copies the current job items into invoice items", async () => {
  await createJobItem(env.DB, admin, jobId, {
    description: "Front lawn",
    amountCents: 4500,
  });

  await createJobItem(env.DB, admin, jobId, {
    description: "Back lawn",
    amountCents: 3500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  const items = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  expect(items).toHaveLength(2);

  expect(items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        invoiceId,
        description: "Front lawn",
        amountCents: 4500,
      }),
      expect.objectContaining({
        invoiceId,
        description: "Back lawn",
        amountCents: 3500,
      }),
    ]),
  );
});

it("creates an empty draft when the job has no items", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  expect(
    await createDb(env.DB)
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId)),
  ).toEqual([]);
});

it("copies the customer from the job", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  const invoice = await createDb(env.DB)
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();

  expect(invoice?.customerId).toBe("customer");
});

it("does not allocate an invoice number to a draft", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  const invoice = await createDb(env.DB)
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();

  expect(invoice?.invoiceNumber).toBeNull();
});

it("creates an independent snapshot of job items", async () => {
  const { id: jobItemId } = await createJobItem(env.DB, admin, jobId, {
    description: "Front lawn",
    amountCents: 4500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, jobId);

  await createDb(env.DB)
    .update(jobItems)
    .set({
      description: "Changed after invoice creation",
      amountCents: 9999,
      updatedAt: Date.now(),
    })
    .where(eq(jobItems.id, jobItemId));

  const items = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  expect(items).toEqual([
    expect.objectContaining({
      description: "Front lawn",
      amountCents: 4500,
    }),
  ]);
});

it.each(["scheduled", "in_progress", "completed", "cancelled"] as const)(
  "allows a draft invoice to be created while the job is %s",
  async (status) => {
    if (status !== "scheduled") {
      await createDb(env.DB)
        .insert(jobStatusHistory)
        .values({
          id: `status-${status}`,
          jobId,
          status,
          createdByUserId: admin.id,
          createdAt: Date.now() + 1,
        });
    }

    const result = await createDraftInvoice(env.DB, admin, jobId);

    expect(
      await createDb(env.DB)
        .select()
        .from(invoices)
        .where(eq(invoices.id, result.id)),
    ).toEqual([
      expect.objectContaining({
        jobId,
        status: "draft",
      }),
    ]);
  },
);

it("rejects a missing job without creating invoice data", async () => {
  await expect(
    createDraftInvoice(env.DB, admin, "missing"),
  ).rejects.toBeInstanceOf(JobNotFoundError);

  expect(await createDb(env.DB).select().from(invoices)).toEqual([]);

  expect(await createDb(env.DB).select().from(invoiceItems)).toEqual([]);
});

it("requires invoice management permission", async () => {
  await expect(
    createDraftInvoice(
      env.DB,
      {
        ...admin,
        role: "operator",
      },
      jobId,
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await createDb(env.DB).select().from(invoices)).toEqual([]);

  expect(await createDb(env.DB).select().from(invoiceItems)).toEqual([]);
});
