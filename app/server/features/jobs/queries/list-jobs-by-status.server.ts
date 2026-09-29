import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { invoices } from "../../../db/schema/invoices";
import { jobItems } from "../../../db/schema/job-items";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";
import type { JobStatus } from "../job-status";

export async function listJobsByStatus(
  binding: Env["DB"],
  user: CurrentUser,
  status: JobStatus,
) {
  if (!can(user, "jobs.read")) throw new PermissionDeniedError();

  const db = createDb(binding);
  const history = alias(jobStatusHistory, "latest_history");

  // IDs provide a deterministic tie-break when history timestamps are equal.
  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobs.id))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(1);

  const query = db
    .select({
      id: jobs.id,
      name: jobs.name,
      customerId: jobs.customerId,
      customerName: customers.name,
      description: jobs.description,
      scheduledDate: jobs.scheduledDate,
      currentStatus: jobStatusHistory.status,
      statusChangedAt: jobStatusHistory.createdAt,
      totalCents: sql<number>`
        coalesce(${jobs.servicePriceCents}, 0) + coalesce(
          (
            select sum(${jobItems.quantity} * ${jobItems.unitPriceCents})
            from ${jobItems}
            where ${jobItems.jobId} = ${jobs.id}
          ),
          0
        )
      `,
      invoiceId: invoiceJobs.invoiceId,
      invoiceNumber: invoices.invoiceNumber,
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
    .leftJoin(invoices, eq(invoices.id, invoiceJobs.invoiceId))
    .where(eq(jobStatusHistory.status, status));

  if (status === "scheduled" || status === "in_progress") {
    return query.orderBy(asc(jobs.scheduledDate), asc(jobs.id));
  }

  return query.orderBy(desc(jobStatusHistory.createdAt), asc(jobs.id));
}
