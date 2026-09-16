import { eq, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { jobItems } from "../../../db/schema/job-items";
import { jobs } from "../../../db/schema/jobs";
import { JobNotFoundError } from "../errors/job-not-found-error";
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

  const id = crypto.randomUUID();
  const now = Date.now();

  const created = await db
    .insert(jobItems)
    .select(
      db
        .select({
          id: sql<string>`${id}`.as("id"),
          jobId: jobs.id,
          description: sql<string>`${values.description}`.as(
            "description",
          ),
          amountCents: sql<number>`${values.amountCents}`.as(
            "amount_cents",
          ),
          createdAt: sql<number>`${now}`.as("created_at"),
          updatedAt: sql<number>`${now}`.as("updated_at"),
        })
        .from(jobs)
        .where(eq(jobs.id, jobId)),
    )
    .returning({ id: jobItems.id });

  if (!created.length) {
    throw new JobNotFoundError();
  }

  return created[0];
}