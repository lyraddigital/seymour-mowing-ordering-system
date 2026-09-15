import { and, eq, isNull, sql } from "drizzle-orm";
import { can } from "../../../auth/authorization/policies/can";
import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";
import type { CreateJobInput } from "../types/create-job-input";
import { validateCreateJob } from "../validation/validate-create-job";
import { JobValidationError } from "../errors/job-validation-error";

export async function createJob(
  binding: Env["DB"],
  user: CurrentUser,
  input: CreateJobInput,
) {
  if (!can(user, "jobs.manage")) throw new PermissionDeniedError();
  const values = validateCreateJob(input);
  const db = createDb(binding);
  const id = crypto.randomUUID();
  const now = Date.now();
  // D1 batch is a transaction. The conditional insert checks customer state
  // within that transaction, avoiding a race with archiving a customer.
  const [created] = await db.batch([
    db
      .insert(jobs)
      .select(
        db
          .select({
            id: sql<string>`${id}`.as("id"),
            customerId: customers.id,
            name: sql<string>`${values.name}`.as("name"),
            description: sql<string>`${values.description}`.as("description"),
            scheduledDate: sql<string>`${values.scheduledDate}`.as(
              "scheduled_date",
            ),
            createdAt: sql<number>`${now}`.as("created_at"),
            updatedAt: sql<number>`${now}`.as("updated_at"),
          })
          .from(customers)
          .where(
            and(
              eq(customers.id, values.customerId),
              isNull(customers.archivedAt),
            ),
          ),
      )
      .returning({ id: jobs.id }),
    db.insert(jobStatusHistory).select(
      db
        .select({
          id: sql<string>`${crypto.randomUUID()}`.as("id"),
          jobId: jobs.id,
          status: sql<"scheduled">`'scheduled'`.as("status"),
          createdByUserId: sql<string>`${user.id}`.as("created_by_user_id"),
          createdAt: sql<number>`${now}`.as("created_at"),
        })
        .from(jobs)
        .where(eq(jobs.id, id)),
    ),
  ]);
  if (!created.length)
    throw new JobValidationError({ customerId: "Select an active customer." });
  return { id };
}
