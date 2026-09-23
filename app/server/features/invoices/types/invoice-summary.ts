import type { InvoiceJobSummary } from "./invoice-job-summary";

export interface InvoiceSummary {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string | null;
  status: "draft" | "issued" | "voided";
  dueDate: string | null;
  issuedAt: number | null;
  voidedAt: number | null;
  createdAt: number;
  updatedAt: number;
  totalCents: number;
  jobs: InvoiceJobSummary[];
}
