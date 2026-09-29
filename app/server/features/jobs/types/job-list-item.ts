import type { listJobsByStatus } from "../queries/list-jobs-by-status.server";

export type JobListItem = Awaited<ReturnType<typeof listJobsByStatus>>[number];
