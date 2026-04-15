export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export type InvoiceSummaryDto = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalIncGst: number;
  balanceDue: number;
  status: InvoiceStatus;
};