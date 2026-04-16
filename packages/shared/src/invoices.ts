export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export type InvoiceSummaryDto = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalIncGst: number;
  balanceDue: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
};

export type InvoiceListDto = {
  items: InvoiceSummaryDto[];
};

export type InvoiceLineItemDto = {
  id: string;
  description: string;
  qty: number;
  unitPriceExGst: number;
  lineTotalExGst: number;
};

export type PaymentSummaryDto = {
  id: string;
  paidDate: string;
  amount: number;
  method: string;
  reference?: string;
};

export type InvoiceDetailDto = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  items: InvoiceLineItemDto[];
  payments: PaymentSummaryDto[];
  subtotalExGst: number;
  gstAmount: number;
  totalIncGst: number;
  balanceDue: number;
};