import type { InvoiceSummaryDto } from "./invoices";
import type { JobSummaryDto } from "./jobs";

export type DashboardDto = {
  outstandingInvoicesCount: number;
  outstandingInvoicesTotal: number;
  completedUninvoicedJobsCount: number;
  upcomingJobs: JobSummaryDto[];
  recentInvoices: InvoiceSummaryDto[];
};