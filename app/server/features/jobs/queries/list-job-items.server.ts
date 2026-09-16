import { asc, eq } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { jobItems } from "../../../db/schema/job-items";
import type { JobItemListResult } from "../types/job-item-list-result";

export async function listJobItems(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
): Promise<JobItemListResult> {
  if (!can(user, "jobs.read")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  const items = await db
    .select({
      id: jobItems.id,
      jobId: jobItems.jobId,
      description: jobItems.description,
      amountCents: jobItems.amountCents,
      createdAt: jobItems.createdAt,
      updatedAt: jobItems.updatedAt,
    })
    .from(jobItems)
    .where(eq(jobItems.jobId, jobId))
    .orderBy(asc(jobItems.createdAt), asc(jobItems.id));

  return {
    items,
    totalCents: items.reduce((total, item) => total + item.amountCents, 0),
  };
}
