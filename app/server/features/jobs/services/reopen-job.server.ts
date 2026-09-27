import { and, desc, eq, isNull, notExists, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";
import { JobNotFoundError } from "../errors/job-not-found-error";
import { JobStateConflictError } from "../errors/job-state-conflict-error";

export async function reopenJob(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
) {
  if (!can(user, "jobs.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);
  const history = alias(jobStatusHistory, "latest_history");

  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobId))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(1);

  // Reopening is one atomic conditional insert:
  //
  // - the latest status must still be completed;
  // - the job must not have an active invoice allocation.
  //
  // This prevents a competing request from reopening a job after it has been
  // allocated to an invoice.
  const inserted = await db
    .insert(jobStatusHistory)
    .select(
      db
        .select({
          id: sql<string>`${crypto.randomUUID()}`.as("id"),
          jobId: jobStatusHistory.jobId,
          status: sql<"in_progress">`'in_progress'`.as("status"),
          createdByUserId: sql<string>`${user.id}`.as("created_by_user_id"),
          createdAt:
            sql<number>`max(${Date.now()}, ${jobStatusHistory.createdAt} + 1)`.as(
              "created_at",
            ),
        })
        .from(jobStatusHistory)
        .where(
          and(
            eq(jobStatusHistory.id, latest),
            eq(jobStatusHistory.status, "completed"),
            notExists(
              db
                .select({
                  jobId: invoiceJobs.jobId,
                })
                .from(invoiceJobs)
                .where(
                  and(
                    eq(invoiceJobs.jobId, jobId),
                    isNull(invoiceJobs.releasedAt),
                  ),
                ),
            ),
          ),
        ),
    )
    .returning({
      id: jobStatusHistory.jobId,
    })
    .get();

  if (inserted) {
    return inserted;
  }

  const existing = await db
    .select({
      id: jobs.id,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .get();

  if (!existing) {
    throw new JobNotFoundError();
  }

  const activeInvoice = await db
    .select({
      jobId: invoiceJobs.jobId,
    })
    .from(invoiceJobs)
    .where(and(eq(invoiceJobs.jobId, jobId), isNull(invoiceJobs.releasedAt)))
    .limit(1)
    .get();

  if (activeInvoice) {
    throw new JobStateConflictError(
      "A job assigned to an active invoice cannot be reopened.",
    );
  }

  throw new JobStateConflictError("Only completed jobs can be reopened.");
}
