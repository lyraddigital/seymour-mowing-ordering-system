export const jobStatuses = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type JobStatus = (typeof jobStatuses)[number];

export function isJobStatus(value: string | null): value is JobStatus {
  return jobStatuses.some((status) => status === value);
}
