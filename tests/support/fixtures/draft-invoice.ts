import { payments } from "../../../app/server/db/schema/payments";
import { env } from "cloudflare:workers";
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
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "./internal-user";

export async function draftInvoiceFixture() {
  const db = createDb(env.DB);
  for (const table of [
    payments,
    invoiceItems,
    invoiceJobs,
    invoices,
    jobItems,
    jobStatusHistory,
    jobs,
    customers,
    users,
  ])
    await db.delete(table);
  const admin = internalUser();
  await db.insert(users).values(admin);
  await db
    .insert(customers)
    .values({ id: "customer", name: "John Smith", createdAt: 1, updatedAt: 1 });
  const { id: jobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow",
    scheduledDate: "2026-09-20",
  });
  const { id: otherJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Back lawn",
    description: "Mow",
    scheduledDate: "2026-09-21",
  });
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });
  return { admin, invoiceId, jobId, otherJobId };
}
