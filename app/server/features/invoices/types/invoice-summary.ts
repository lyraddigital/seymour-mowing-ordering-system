export interface InvoiceSummary {
  id: string;
  jobId: string;
  jobName: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string | null;
  status: "draft" | "issued" | "voided";
  issuedAt: number | null;
  voidedAt: number | null;
  createdAt: number;
  updatedAt: number;
  totalCents: number;
}
