import type { listActiveJobs } from "../queries/list-active-jobs.server";

export type JobSummary = Awaited<ReturnType<typeof listActiveJobs>>[number];
