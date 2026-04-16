export type ScheduledJobPeriod = "ThisWeek" | "ThisMonth" | "ThisYear" | "AllUpcoming";

export type CompletedJobPeriod = "Last7Days" | "Last30Days" | "Last12Months";

export type UnpaidInvoiceFilter =
  | "AllUnpaid"
  | "DueThisWeek"
  | "LateOnly"
  | "LateUnder7Days"
  | "Late7PlusDays";

export type InvoiceAgingState =
  | "NotDue"
  | "DueToday"
  | "LateUnder7Days"
  | "Late7PlusDays";

export type ScheduledJobSummaryDto = {
  id: string;
  customerName: string;
  serviceDate: string;
  serviceType: string;
  status: "Scheduled";
};

export type CompletedJobSummaryDto = {
  id: string;
  customerName: string;
  serviceDate: string;
  serviceType: string;
  status: "Completed";
};

export type UnpaidInvoiceSummaryDto = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  totalIncGst: number;
  balanceDue: number;
  status: "Draft" | "Sent" | "Overdue";
  agingState: InvoiceAgingState;
};

export type DashboardDto = {
  scheduledJobsDefaultPeriod: ScheduledJobPeriod;
  completedJobsDefaultPeriod: CompletedJobPeriod;
  unpaidInvoicesDefaultFilter: UnpaidInvoiceFilter;

  scheduledJobsCount: number;
  completedJobsCount: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesTotal: number;

  scheduledJobs: ScheduledJobSummaryDto[];
  recentlyCompletedJobs: CompletedJobSummaryDto[];
  unpaidInvoices: UnpaidInvoiceSummaryDto[];
};