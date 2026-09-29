import { and, desc, eq, exists, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { jobItems } from "../../../db/schema/job-items";
import { jobStatusHistory } from "../../../db/schema/job-status-history";
import { JobItemNotFoundError } from "../errors/job-item-not-found-error";
import { JobStateConflictError } from "../errors/job-state-conflict-error";
import type { UpdateJobItemInput } from "../types/update-job-item-input";
import { validateUpdateJobItem } from "../validation/validate-update-job-item";

export async function updateJobItem(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
  itemId: string,
  input: UpdateJobItemInput,
) {
  if (!can(user, "jobs.manage")) {
    throw new PermissionDeniedError();
  }

  const values = validateUpdateJobItem(input);
  const db = createDb(binding);

  const history = alias(jobStatusHistory, "latest_history");

  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobItems.jobId))
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

  const updated = await db
    .update(jobItems)
    .set({
      description: values.description,
      quantity: values.quantity,
      unitPriceCents: values.unitPriceCents,
      updatedAt: Date.now(),
    })
    .where(and(eq(jobItems.id, itemId), eq(jobItems.jobId, jobId), editable))
    .returning({ id: jobItems.id })
    .get();

  if (updated) {
    return updated;
  }

  const existing = await db
    .select({
      id: jobItems.id,
    })
    .from(jobItems)
    .where(and(eq(jobItems.id, itemId), eq(jobItems.jobId, jobId)))
    .get();

  if (!existing) {
    throw new JobItemNotFoundError();
  }

  throw new JobStateConflictError(
    "Additional charges can only be changed while the job is scheduled or in progress.",
  );
}
