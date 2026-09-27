import { and, desc, eq, inArray, exists, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";
import { JobValidationError } from "../errors/job-validation-error";
import { JobNotFoundError } from "../errors/job-not-found-error";
import { JobStateConflictError } from "../errors/job-state-conflict-error";

export async function completeJob(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
  servicePriceCents: number,
) {
  if (!can(user, "jobs.manage")) {
    throw new PermissionDeniedError();
  }

  if (!Number.isSafeInteger(servicePriceCents) || servicePriceCents < 0) {
    throw new JobValidationError({ servicePriceCents: "Enter a valid non-negative service price." });
  }

  const db = createDb(binding);
  const historyId = crypto.randomUUID();
  const history = alias(jobStatusHistory, "latest_history");

  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobId))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(1);

  // D1 batch commits history and price together. Only this request's
  // conditional history insert authorizes its price update.
  const [inserted] = await db.batch([
    db
    .insert(jobStatusHistory)
    .select(
      db
        .select({
          id: sql<string>`${historyId}`.as("id"),
          jobId: jobStatusHistory.jobId,
          status: sql<"completed">`'completed'`.as("status"),
          createdByUserId: sql<string>`${user.id}`.as("created_by_user_id"),
          createdAt:
            sql<number>`max(${Date.now()}, ${jobStatusHistory.createdAt} + 1)`.as(
              "created_at",
            ),
        })
        .from(jobStatusHistory)
        .innerJoin(jobs, eq(jobs.id, jobStatusHistory.jobId))
        .where(
          and(
            eq(jobStatusHistory.id, latest),
            inArray(jobStatusHistory.status, ["scheduled", "in_progress"]),
          ),
        ),
    )
    .returning({ id: jobStatusHistory.jobId }),
    db.update(jobs)
      .set({ servicePriceCents, updatedAt: Date.now() })
      .where(and(eq(jobs.id, jobId), exists(
        db.select({ id: jobStatusHistory.id }).from(jobStatusHistory)
          .where(eq(jobStatusHistory.id, historyId)),
      ))),
  ]);

  if (!inserted.length) {
    const existing = await db
      .select({
        id: jobs.id,
        servicePriceCents: jobs.servicePriceCents,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .get();

    if (!existing) {
      throw new JobNotFoundError();
    }

    throw new JobStateConflictError(
      "Only scheduled or in-progress jobs can be completed.",
    );
  }

  return inserted[0];
}
