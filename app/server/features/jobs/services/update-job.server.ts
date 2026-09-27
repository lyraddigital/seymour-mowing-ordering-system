import { and, desc, eq, exists, inArray, isNull, or } from "drizzle-orm";
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

  const billingDetailsEditable = exists(
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

  const servicePriceUnchanged =
    values.servicePriceCents === null
      ? isNull(jobs.servicePriceCents)
      : eq(jobs.servicePriceCents, values.servicePriceCents);

  const updated = await db
    .update(jobs)
    .set({
      name: values.name,
      description: values.description,
      scheduledDate: values.scheduledDate,
      servicePriceCents: values.servicePriceCents,
      updatedAt: Date.now(),
    })
    .where(
      and(
        eq(jobs.id, jobId),
        or(eq(jobs.scheduledDate, values.scheduledDate), currentlyScheduled),
        or(servicePriceUnchanged, billingDetailsEditable),
      ),
    )
    .returning({ id: jobs.id })
    .get();

  if (!updated) {
    const existing = await db
      .select({
        id: jobs.id,
        scheduledDate: jobs.scheduledDate,
        servicePriceCents: jobs.servicePriceCents,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .get();

    if (!existing) {
      throw new JobNotFoundError();
    }

    if (existing.scheduledDate !== values.scheduledDate) {
      throw new JobStateConflictError(
        "Scheduled date can only be changed while the job is scheduled.",
      );
    }

    if (existing.servicePriceCents !== values.servicePriceCents) {
      throw new JobStateConflictError(
        "Service price can only be changed while the job is scheduled or in progress.",
      );
    }

    throw new JobStateConflictError("The job can no longer be updated.");
  }

  return updated;
}
