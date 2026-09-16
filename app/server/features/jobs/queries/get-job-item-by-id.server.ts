import { and, eq } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { jobItems } from "../../../db/schema/job-items";
import type { JobItemSummary } from "../types/job-item-summary";

export async function getJobItemById(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
  itemId: string,
): Promise<JobItemSummary | undefined> {
  if (!can(user, "jobs.read")) {
    throw new PermissionDeniedError();
  }

  return createDb(binding)
    .select({
      id: jobItems.id,
      jobId: jobItems.jobId,
      description: jobItems.description,
      amountCents: jobItems.amountCents,
      createdAt: jobItems.createdAt,
      updatedAt: jobItems.updatedAt,
    })
    .from(jobItems)
    .where(and(eq(jobItems.id, itemId), eq(jobItems.jobId, jobId)))
    .get();
}
