import { and, desc, eq, exists, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { jobItems } from "../../../db/schema/job-items";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";
import { JobNotFoundError } from "../errors/job-not-found-error";
import { JobStateConflictError } from "../errors/job-state-conflict-error";
import type { CreateJobItemInput } from "../types/create-job-item-input";
import { validateCreateJobItem } from "../validation/validate-create-job-item";

export async function createJobItem(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
  input: CreateJobItemInput,
) {
  if (!can(user, "jobs.manage")) {
    throw new PermissionDeniedError();
  }

  const values = validateCreateJobItem(input);
  const db = createDb(binding);

  const history = alias(jobStatusHistory, "latest_history");

  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobs.id))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(1);

  const editable = exists(
    db
      .select({ id: jobStatusHistory.id })
      .from(jobStatusHistory)
      .where(
        and(
          eq(jobStatusHistory.id, latest),
          inArray(jobStatusHistory.status, ["scheduled", "in_progress"]),
        ),
      ),
  );

  const id = crypto.randomUUID();
  const now = Date.now();

  const created = await db
    .insert(jobItems)
    .select(
      db
        .select({
          id: sql<string>`${id}`.as("id"),
          jobId: jobs.id,
          description: sql<string>`${values.description}`.as("description"),
          amountCents: sql<number>`${values.amountCents}`.as("amount_cents"),
          createdAt: sql<number>`${now}`.as("created_at"),
          updatedAt: sql<number>`${now}`.as("updated_at"),
        })
        .from(jobs)
        .where(and(eq(jobs.id, jobId), editable)),
    )
    .returning({ id: jobItems.id });

  if (created.length) {
    return created[0];
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

  throw new JobStateConflictError(
    "Additional charges can only be changed while the job is scheduled or in progress.",
  );
}
