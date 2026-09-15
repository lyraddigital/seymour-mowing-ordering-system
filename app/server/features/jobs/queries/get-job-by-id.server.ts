import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { can } from "../../../auth/authorization/policies/can";
import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";

export async function getJobById(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
) {
  if (!can(user, "jobs.read")) throw new PermissionDeniedError();
  const db = createDb(binding);
  const history = alias(jobStatusHistory, "latest_history");
  // IDs provide a deterministic tie-break when history timestamps are equal.
  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobs.id))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(1);
  const job = await db
    .select({
      id: jobs.id,
      name: jobs.name,
      customerId: jobs.customerId,
      customerName: customers.name,
      description: jobs.description,
      scheduledDate: jobs.scheduledDate,
      currentStatus: jobStatusHistory.status,
    })
    .from(jobs)
    .innerJoin(customers, eq(customers.id, jobs.customerId))
    .innerJoin(
      jobStatusHistory,
      and(eq(jobStatusHistory.jobId, jobs.id), eq(jobStatusHistory.id, latest)),
    )
    .where(eq(jobs.id, jobId))
    .get();
  return job ?? null;
}
