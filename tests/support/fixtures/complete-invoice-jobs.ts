import { env } from "cloudflare:workers";
import type { CurrentUser } from "../../../app/server/auth/principal/types/current-user";
import { getJobById } from "../../../app/server/features/jobs/queries/get-job-by-id.server";
import { completeJob } from "../../../app/server/features/jobs/services/complete-job.server";

// Invoice test setup follows the operational workflow before allocating jobs.
export async function completeInvoiceJobs(user: CurrentUser, jobIds: string[]) {
  for (const jobId of jobIds) {
    const job = await getJobById(env.DB, user, jobId);
    if (!job) throw new Error(`Missing fixture job ${jobId}`);
    if (job.currentStatus !== "completed") await completeJob(env.DB, user, jobId, 10_000);
  }
}
