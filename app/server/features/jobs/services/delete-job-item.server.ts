import { and, eq } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { jobItems } from "../../../db/schema/job-items";
import { JobItemNotFoundError } from "../errors/job-item-not-found-error";

export async function deleteJobItem(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
  itemId: string,
) {
  if (!can(user, "jobs.manage")) {
    throw new PermissionDeniedError();
  }

  const deleted = await createDb(binding)
    .delete(jobItems)
    .where(and(eq(jobItems.id, itemId), eq(jobItems.jobId, jobId)))
    .returning({ id: jobItems.id })
    .get();

  if (!deleted) {
    throw new JobItemNotFoundError();
  }

  return deleted;
}
