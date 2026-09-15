import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { can } from "../../../auth/authorization/policies/can";
import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";
import { JobNotFoundError } from "../errors/job-not-found-error";
import { JobStateConflictError } from "../errors/job-state-conflict-error";

export async function completeJob(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
) {
  if (!can(user, "jobs.manage")) throw new PermissionDeniedError();
  const db = createDb(binding);
  const history = alias(jobStatusHistory, "latest_history");
  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobId))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(1);
  // Check and append in one atomic statement, so competing requests cannot
  // both finish an active job. Advance past even a same-millisecond row.
  const inserted = await db
    .insert(jobStatusHistory)
    .select(
      db
        .select({
          id: sql<string>`${crypto.randomUUID()}`.as("id"),
          jobId: jobStatusHistory.jobId,
          status: sql<"completed">`'completed'`.as("status"),
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
            inArray(jobStatusHistory.status, ["scheduled", "in_progress"]),
          ),
        ),
    )
    .returning({ id: jobStatusHistory.jobId })
    .get();
  if (!inserted) {
    const existing = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .get();
    if (!existing) throw new JobNotFoundError();
    throw new JobStateConflictError("Only scheduled or in-progress jobs can be completed.");
  }
  return inserted;
}

