import type { InvoiceSummaryDto } from "./invoices";
import type { JobSummaryDto } from "./jobs";

export type CustomerSummaryDto = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  suburb?: string;
};

export type CustomerListDto = {
  items: CustomerSummaryDto[];
};

export type CustomerDetailDto = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  serviceAddress?: string;
  suburb?: string;
  notes?: string;
  recentInvoices: InvoiceSummaryDto[];
  recentJobs: JobSummaryDto[];
};