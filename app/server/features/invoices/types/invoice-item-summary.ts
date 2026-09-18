export interface InvoiceItemSummary {
  id: string;
  invoiceId: string;
  jobId: string;
  description: string;
  amountCents: number;
  createdAt: number;
}
