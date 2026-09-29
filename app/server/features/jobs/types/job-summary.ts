import type { getJobById } from "../queries/get-job-by-id.server";

export type JobSummary = NonNullable<Awaited<ReturnType<typeof getJobById>>>;
