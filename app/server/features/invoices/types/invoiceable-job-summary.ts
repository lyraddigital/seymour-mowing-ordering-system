export interface InvoiceableJobSummary {
  id: string;
  customerId: string;
  customerName: string;
  name: string;
  scheduledDate: string;
  totalCents: number;
}
