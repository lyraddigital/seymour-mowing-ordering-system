import { and, desc, eq, exists, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";
import { JobNotFoundError } from "../errors/job-not-found-error";
import { JobStateConflictError } from "../errors/job-state-conflict-error";
import type { UpdateJobInput } from "../types/update-job-input";
import { validateUpdateJob } from "../validation/validate-update-job";

export async function updateJob(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
  input: UpdateJobInput,
) {
  if (!can(user, "jobs.manage")) {
    throw new PermissionDeniedError();
  }

  const values = validateUpdateJob(input);
  const db = createDb(binding);

  const history = alias(jobStatusHistory, "latest_history");

  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobs.id))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(1);

  const currentlyScheduled = exists(
    db
      .select({ id: jobStatusHistory.id })
      .from(jobStatusHistory)
      .where(
        and(
          eq(jobStatusHistory.id, latest),
          eq(jobStatusHistory.status, "scheduled"),
        ),
      ),
  );

  const updated = await db
    .update(jobs)
    .set({
      name: values.name,
      description: values.description,
      scheduledDate: values.scheduledDate,
      updatedAt: Date.now(),
    })
    .where(
      and(
        eq(jobs.id, jobId),
        or(eq(jobs.scheduledDate, values.scheduledDate), currentlyScheduled),
      ),
    )
    .returning({ id: jobs.id })
    .get();

  if (!updated) {
    const existing = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .get();

    if (!existing) {
      throw new JobNotFoundError();
    }

    throw new JobStateConflictError(
      "Scheduled date can only be changed while the job is scheduled.",
    );
  }

  return updated;
}
