import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { jobItems } from "../../../db/schema/job-items";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";
import type { InvoiceableJobSummary } from "../types/invoiceable-job-summary";

export async function listInvoiceableJobs(
  binding: Env["DB"],
  user: CurrentUser,
): Promise<InvoiceableJobSummary[]> {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);
  const history = alias(jobStatusHistory, "latest_history");
  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobs.id))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(1);

  return db
    .select({
      id: jobs.id,
      customerId: jobs.customerId,
      customerName: customers.name,
      name: jobs.name,
      scheduledDate: jobs.scheduledDate,
      totalCents: sql<number>`
        ${jobs.servicePriceCents} + coalesce(
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
    .innerJoin(
      jobStatusHistory,
      and(eq(jobStatusHistory.jobId, jobs.id), eq(jobStatusHistory.id, latest)),
    )
    .leftJoin(
      invoiceJobs,
      and(eq(invoiceJobs.jobId, jobs.id), isNull(invoiceJobs.releasedAt)),
    )
    .where(
      and(
        isNull(invoiceJobs.invoiceId),
        eq(jobStatusHistory.status, "completed"),
        sql`${jobs.servicePriceCents} is not null`,
      ),
    )
    .orderBy(asc(customers.name), asc(jobs.scheduledDate), asc(jobs.id));
}
