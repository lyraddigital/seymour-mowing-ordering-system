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
import { isJobInvoiceable } from "../../../../../../app/server/features/invoices/queries/is-job-invoiceable.server";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { issueInvoice } from "../../../../../../app/server/features/invoices/services/issue-invoice.server";
import { voidInvoice } from "../../../../../../app/server/features/invoices/services/void-invoice.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const admin = internalUser();

let jobId: string;

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
    scheduledDate: "2026-09-19",
  }));
});

it("returns true when the job has no active invoice", async () => {
  expect(await isJobInvoiceable(env.DB, admin, jobId)).toBe(true);
});

it("returns false when the job belongs to a draft invoice", async () => {
  await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  expect(await isJobInvoiceable(env.DB, admin, jobId)).toBe(false);
});

it("returns false when the job belongs to an issued invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  expect(await isJobInvoiceable(env.DB, admin, jobId)).toBe(false);
});

it("returns true after the invoice is voided", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  await voidInvoice(env.DB, admin, invoiceId);

  expect(await isJobInvoiceable(env.DB, admin, jobId)).toBe(true);
});

it("requires invoice management permission", async () => {
  await expect(
    isJobInvoiceable(
      env.DB,
      {
        ...admin,
        role: "operator",
      },
      jobId,
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
