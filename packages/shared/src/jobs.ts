export type JobStatus = "Scheduled" | "Completed" | "Invoiced";

export type JobSummaryDto = {
  id: string;
  customerName: string;
  serviceDate: string;
  status: JobStatus;
};