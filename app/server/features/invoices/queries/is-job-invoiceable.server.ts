import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";

export async function isJobInvoiceable(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
): Promise<boolean> {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  const [activeInvoiceJob] = await db
    .select({
      jobId: invoiceJobs.jobId,
    })
    .from(invoiceJobs)
    .where(and(eq(invoiceJobs.jobId, jobId), isNull(invoiceJobs.releasedAt)))
    .limit(1);

  const history = alias(jobStatusHistory, "latest_history");
  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobs.id))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(1);

  const completed = await db
    .select({ id: jobs.id })
    .from(jobs)
    .innerJoin(
      jobStatusHistory,
      and(eq(jobStatusHistory.jobId, jobs.id), eq(jobStatusHistory.id, latest)),
    )
    .where(
      and(
        eq(jobs.id, jobId),
        eq(jobStatusHistory.status, "completed"),
        isNotNull(jobs.servicePriceCents),
      ),
    )
    .get();

  return !!completed && !activeInvoiceJob;
}
