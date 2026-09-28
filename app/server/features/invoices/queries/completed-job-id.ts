import { sql } from "drizzle-orm";

// Null values deliberately fail invoice_jobs constraints during allocation,
// rolling back the batch if a job is concurrently reopened or loses pricing.
export function completedJobId(jobId: string) {
  return sql<string | null>`(select case when history.status = 'completed'
    and job.service_price_cents is not null
    then history.job_id end from job_status_history history
    inner join jobs job on job.id = history.job_id
    where history.job_id = ${jobId}
    order by history.created_at desc, history.id desc limit 1)`;
}

export function completedJobAt(jobId: string) {
  return sql<number | null>`(select case when history.status = 'completed'
    and job.service_price_cents is not null
    then history.created_at end from job_status_history history
    inner join jobs job on job.id = history.job_id
    where history.job_id = ${jobId}
    order by history.created_at desc, history.id desc limit 1)`;
}
