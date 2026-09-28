export interface InvoiceItemSummary {
  id: string;
  invoiceId: string;
  jobId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  amountCents: number;
  createdAt: number;
}
