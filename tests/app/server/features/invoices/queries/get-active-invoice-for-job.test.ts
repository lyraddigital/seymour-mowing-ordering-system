import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
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
import { getActiveInvoiceForJob } from "../../../../../../app/server/features/invoices/queries/get-active-invoice-for-job.server";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { issueInvoice } from "../../../../../../app/server/features/invoices/services/issue-invoice.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const admin = internalUser();

let jobId: string;
let otherJobId: string;

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

  ({ id: jobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-17",
  }));

  ({ id: otherJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Back lawn",
    description: "Mow back lawn",
    scheduledDate: "2026-09-18",
  }));
});

it("returns null when the job has no active invoice", async () => {
  expect(await getActiveInvoiceForJob(env.DB, admin, jobId)).toBeNull();
});

it("returns the active draft invoice for the job", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  expect(await getActiveInvoiceForJob(env.DB, admin, jobId)).toEqual({
    id: invoiceId,
    invoiceNumber: null,
    status: "draft",
  });
});

it("returns the active issued invoice for the job", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  expect(await getActiveInvoiceForJob(env.DB, admin, jobId)).toEqual({
    id: invoiceId,
    invoiceNumber: "INV-000001",
    status: "issued",
  });
});

it("ignores released invoice assignments", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  await createDb(env.DB)
    .update(invoiceJobs)
    .set({
      releasedAt: Date.now(),
    })
    .where(
      and(eq(invoiceJobs.invoiceId, invoiceId), eq(invoiceJobs.jobId, jobId)),
    );

  expect(await getActiveInvoiceForJob(env.DB, admin, jobId)).toBeNull();
});

it("does not return an invoice assigned to another job", async () => {
  await createDraftInvoice(env.DB, admin, {
    jobIds: [otherJobId],
  });

  expect(await getActiveInvoiceForJob(env.DB, admin, jobId)).toBeNull();
});

it("returns the same active invoice when it contains multiple jobs", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId, otherJobId],
  });

  expect(await getActiveInvoiceForJob(env.DB, admin, jobId)).toEqual({
    id: invoiceId,
    invoiceNumber: null,
    status: "draft",
  });

  expect(await getActiveInvoiceForJob(env.DB, admin, otherJobId)).toEqual({
    id: invoiceId,
    invoiceNumber: null,
    status: "draft",
  });
});

it("requires invoice read permission", async () => {
  await expect(
    getActiveInvoiceForJob(
      env.DB,
      {
        ...admin,
        role: "unknown" as "admin",
      },
      jobId,
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
