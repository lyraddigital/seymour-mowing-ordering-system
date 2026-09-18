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
import { InvoiceJobConflictError } from "../../../../../../app/server/features/invoices/errors/invoice-job-conflict-error";
import { InvoiceJobSelectionError } from "../../../../../../app/server/features/invoices/errors/invoice-job-selection-error";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const admin = internalUser();

let firstJobId: string;
let secondJobId: string;

beforeEach(async () => {
  const db = createDb(env.DB);

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

it("creates a draft invoice from one job", async () => {
  const result = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const invoice = await createDb(env.DB)
    .select()
    .from(invoices)
    .where(eq(invoices.id, result.id))
    .get();

  expect(invoice).toMatchObject({
    id: result.id,
    customerId: "customer",
    invoiceNumber: null,
    status: "draft",
    issuedAt: null,
    voidedAt: null,
  });
});

it("creates a draft invoice from multiple jobs for the same customer", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const assignments = await createDb(env.DB)
    .select()
    .from(invoiceJobs)
    .where(eq(invoiceJobs.invoiceId, invoiceId));

  expect(assignments).toHaveLength(2);

  expect(assignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        invoiceId,
        jobId: firstJobId,
        releasedAt: null,
      }),
      expect.objectContaining({
        invoiceId,
        jobId: secondJobId,
        releasedAt: null,
      }),
    ]),
  );
});

it("copies items from all selected jobs", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  await createJobItem(env.DB, admin, secondJobId, {
    description: "Back lawn mow",
    amountCents: 3500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const items = await createDb(env.DB)
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  expect(items).toHaveLength(2);

  expect(items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        invoiceId,
        jobId: firstJobId,
        description: "Front lawn mow",
        amountCents: 4500,
      }),
      expect.objectContaining({
        invoiceId,
        jobId: secondJobId,
        description: "Back lawn mow",
        amountCents: 3500,
      }),
    ]),
  );
});

it("creates an empty draft when selected jobs have no items", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  expect(
    await createDb(env.DB)
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId)),
  ).toEqual([]);

  expect(
    await createDb(env.DB)
      .select()
      .from(invoiceJobs)
      .where(eq(invoiceJobs.invoiceId, invoiceId)),
  ).toHaveLength(2);
});

it("derives the customer from the selected jobs", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const invoice = await createDb(env.DB)
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();

  expect(invoice?.customerId).toBe("customer");
});

it("creates an independent snapshot of job items", async () => {
  const { id: jobItemId } = await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await createDb(env.DB)
    .update(jobItems)
    .set({
      description: "Changed later",
      amountCents: 9999,
      updatedAt: Date.now(),
    })
    .where(eq(jobItems.id, jobItemId));

  expect(
    await createDb(env.DB)
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId)),
  ).toEqual([
    expect.objectContaining({
      jobId: firstJobId,
      description: "Front lawn mow",
      amountCents: 4500,
    }),
  ]);
});

it("rejects an empty job selection", async () => {
  await expect(
    createDraftInvoice(env.DB, admin, {
      jobIds: [],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobSelectionError);

  expect(await createDb(env.DB).select().from(invoices)).toEqual([]);
});

it("rejects duplicate selected job ids", async () => {
  await expect(
    createDraftInvoice(env.DB, admin, {
      jobIds: [firstJobId, firstJobId],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobSelectionError);

  expect(await createDb(env.DB).select().from(invoices)).toEqual([]);
});

it("rejects a missing selected job", async () => {
  await expect(
    createDraftInvoice(env.DB, admin, {
      jobIds: [firstJobId, "missing"],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobSelectionError);

  expect(await createDb(env.DB).select().from(invoices)).toEqual([]);
});

it("rejects jobs belonging to different customers", async () => {
  const db = createDb(env.DB);

  await db.insert(customers).values({
    id: "other-customer",
    name: "Jane Smith",
    createdAt: 1,
    updatedAt: 1,
  });

  const { id: otherJobId } = await createJob(env.DB, admin, {
    customerId: "other-customer",
    name: "Other customer job",
    description: "Other work",
    scheduledDate: "2026-09-19",
  });

  await expect(
    createDraftInvoice(env.DB, admin, {
      jobIds: [firstJobId, otherJobId],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobSelectionError);

  expect(await createDb(env.DB).select().from(invoices)).toEqual([]);
});

it("rejects a job already attached to an active invoice", async () => {
  const firstInvoice = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await expect(
    createDraftInvoice(env.DB, admin, {
      jobIds: [firstJobId],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobConflictError);

  expect(await createDb(env.DB).select().from(invoices)).toEqual([
    expect.objectContaining({
      id: firstInvoice.id,
    }),
  ]);
});

it("rejects the whole selection when one job is already invoiced", async () => {
  await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await expect(
    createDraftInvoice(env.DB, admin, {
      jobIds: [firstJobId, secondJobId],
    }),
  ).rejects.toBeInstanceOf(InvoiceJobConflictError);

  expect(
    await createDb(env.DB)
      .select()
      .from(invoiceJobs)
      .where(eq(invoiceJobs.jobId, secondJobId)),
  ).toEqual([]);
});

it("does not allocate an invoice number to a draft", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const invoice = await createDb(env.DB)
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();

  expect(invoice?.invoiceNumber).toBeNull();
});

it("requires invoice management permission", async () => {
  await expect(
    createDraftInvoice(
      env.DB,
      {
        ...admin,
        role: "operator",
      },
      {
        jobIds: [firstJobId],
      },
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  expect(await createDb(env.DB).select().from(invoices)).toEqual([]);

  expect(await createDb(env.DB).select().from(invoiceJobs)).toEqual([]);

  expect(await createDb(env.DB).select().from(invoiceItems)).toEqual([]);
});
