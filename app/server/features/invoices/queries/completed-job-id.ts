import { sql } from "drizzle-orm";
import { jobs } from "../../../db/schema/jobs";

// A null id deliberately fails the invoice_jobs NOT NULL constraint during
// allocation, rolling back the batch if a job was concurrently reopened.
export function completedJobId(jobId: string | typeof jobs.id) {
  // Qualify the outer column explicitly: Drizzle unqualifies columns in select
  // expressions, which would otherwise bind to the history row's own id.
  const id = typeof jobId === "string" ? sql`${jobId}` : sql`jobs.id`;
  return sql<string | null>`(select case when history.status = 'completed'
    then history.job_id end from job_status_history history
    where history.job_id = ${id}
    order by history.created_at desc, history.id desc limit 1)`;
}
