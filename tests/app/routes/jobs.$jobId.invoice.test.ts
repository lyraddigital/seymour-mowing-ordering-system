import { env } from "cloudflare:workers";
import { RouterContextProvider } from "react-router";
import { beforeEach, expect, it } from "vitest";

import { loader } from "../../../app/routes/jobs.$jobId";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { invoiceItems } from "../../../app/server/db/schema/invoice-items";
import { invoiceJobs } from "../../../app/server/db/schema/invoice-jobs";
import { invoices } from "../../../app/server/db/schema/invoices";
import { jobItems } from "../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../app/server/db/schema/jobs";
import { users } from "../../../app/server/db/schema/users";
import { createDraftInvoice } from "../../../app/server/features/invoices/services/create-draft-invoice.server";
import { issueInvoice } from "../../../app/server/features/invoices/services/issue-invoice.server";
import { voidInvoice } from "../../../app/server/features/invoices/services/void-invoice.server";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../support/fixtures/internal-user";

const admin = internalUser();

let context: RouterContextProvider;
let jobId: string;

function loaderArgs(id: string) {
  return {
    context,
    request: new Request(`https://example.test/jobs/${id}`),
    url: new URL(`https://example.test/jobs/${id}`),
    params: {
      jobId: id,
    },
    pattern: "/jobs/:jobId",
  };
}

beforeEach(async () => {
  context = new RouterContextProvider();

  context.set(currentUserContext, admin);

  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

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

it("allows invoice creation when the job has no active invoice", async () => {
  const result = await loader(loaderArgs(jobId));

  expect(result.canCreateInvoice).toBe(true);
});

it("does not allow invoice creation when the job belongs to a draft invoice", async () => {
  await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  const result = await loader(loaderArgs(jobId));

  expect(result.canCreateInvoice).toBe(false);
});

it("does not allow invoice creation when the job belongs to an issued invoice", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  const result = await loader(loaderArgs(jobId));

  expect(result.canCreateInvoice).toBe(false);
});

it("allows invoice creation again after the invoice is voided", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  await issueInvoice(env.DB, admin, invoiceId, {
    dueDate: "2026-10-01",
  });

  await voidInvoice(env.DB, admin, invoiceId);

  const result = await loader(loaderArgs(jobId));

  expect(result.canCreateInvoice).toBe(true);
});

it("does not allow an operator to create an invoice", async () => {
  context.set(currentUserContext, {
    ...admin,
    role: "operator",
  });

  const result = await loader(loaderArgs(jobId));

  expect(result.canCreateInvoice).toBe(false);
});
