import { and, eq } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { jobItems } from "../../../db/schema/job-items";
import { JobItemNotFoundError } from "../errors/job-item-not-found-error";
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

  const updated = await db
    .update(jobItems)
    .set({
      description: values.description,
      amountCents: values.amountCents,
      updatedAt: Date.now(),
    })
    .where(and(eq(jobItems.id, itemId), eq(jobItems.jobId, jobId)))
    .returning({ id: jobItems.id })
    .get();

  if (!updated) {
    throw new JobItemNotFoundError();
  }

  return updated;
}
