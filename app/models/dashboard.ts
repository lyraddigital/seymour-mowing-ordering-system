import { DashboardCustomer } from "./dashboard-customer";
import { DashboardJob } from "./dashboard-job";
import { DashboardSummary } from "./dashboard-summary";

export interface Dashboard {
  summary: DashboardSummary;
  customersOwing: DashboardCustomer[];
  latestJobs: DashboardJob[];
}
