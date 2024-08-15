import { DashboardCustomer } from "./dashboard-customer";
import { DashboardJob } from "./dashboard-job";
import { DashboardSummary } from "./dashboard-summary";
import { DashboardUnpaidInvoice } from "./dashboard-unpaid-invoice";

export interface Dashboard {
  summary: DashboardSummary;
  customersOwing: DashboardCustomer[];
  unpaidInvoices: DashboardUnpaidInvoice[];
  latestJobs: DashboardJob[];
  recentPayments: unknown[];
}
