import { env } from "cloudflare:workers";
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

it("returns invoice detail with multiple jobs", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const result = await getInvoiceById(env.DB, admin, invoiceId);

  expect(result).toEqual({
    invoice: expect.objectContaining({
      id: invoiceId,
      customerId: "customer",
      customerName: "John Smith",
      invoiceNumber: null,
      status: "draft",
      totalCents: 0,
      jobs: [
        {
          id: firstJobId,
          name: "Front lawn",
          scheduledDate: "2026-09-17",
        },
        {
          id: secondJobId,
          name: "Back lawn",
          scheduledDate: "2026-09-18",
        },
      ],
    }),
    items: [],
  });
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

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const result = await getInvoiceById(env.DB, admin, invoiceId);

  expect(result?.items).toHaveLength(2);

  expect(result?.items).toEqual(
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

it("derives the invoice total across all invoice items", async () => {
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

  const result = await getInvoiceById(env.DB, admin, invoiceId);

  expect(result?.invoice.totalCents).toBe(8000);
});

it("returns jobs in scheduled-date order", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [secondJobId, firstJobId],
  });

  const result = await getInvoiceById(env.DB, admin, invoiceId);

  expect(result?.invoice.jobs.map((job) => job.id)).toEqual([
    firstJobId,
    secondJobId,
  ]);
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
