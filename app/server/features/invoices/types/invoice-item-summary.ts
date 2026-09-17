export interface InvoiceItemSummary {
  id: string;
  invoiceId: string;
  description: string;
  amountCents: number;
  createdAt: number;
}
