import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { jobItems } from "../../../db/schema/job-items";
import { jobs } from "../../../db/schema/jobs";
import type { InvoiceableJobSummary } from "../types/invoiceable-job-summary";

export async function listInvoiceableJobs(
  binding: Env["DB"],
  user: CurrentUser,
): Promise<InvoiceableJobSummary[]> {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  return db
    .select({
      id: jobs.id,
      customerId: jobs.customerId,
      customerName: customers.name,
      name: jobs.name,
      scheduledDate: jobs.scheduledDate,
      totalCents: sql<number>`
        coalesce(
          (
            select sum(${jobItems.amountCents})
            from ${jobItems}
            where ${jobItems.jobId} = ${jobs.id}
          ),
          0
        )
      `,
    })
    .from(jobs)
    .innerJoin(customers, eq(customers.id, jobs.customerId))
    .leftJoin(
      invoiceJobs,
      and(eq(invoiceJobs.jobId, jobs.id), isNull(invoiceJobs.releasedAt)),
    )
    .where(isNull(invoiceJobs.invoiceId))
    .orderBy(asc(customers.name), asc(jobs.scheduledDate), asc(jobs.id));
}
