export type JobStatus = "Scheduled" | "Completed" | "Invoiced";

export type JobSummaryDto = {
  id: string;
  customerName: string;
  serviceDate: string;
  serviceType: string;
  status: JobStatus;
};

export type JobListDto = {
  items: JobSummaryDto[];
};

export type JobLineItemDto = {
  id: string;
  description: string;
  qty: number;
  unitPriceExGst: number;
  lineTotalExGst: number;
};

export type JobDetailDto = {
  id: string;
  customer: {
    id: string;
    name: string;
  };
  serviceDate: string;
  serviceType: string;
  status: JobStatus;
  serviceAddress?: string;
  notes?: string;
  items: JobLineItemDto[];
  linkedInvoice?: {
    id: string;
    invoiceNumber: string;
    status: "Draft" | "Sent" | "Paid" | "Overdue";
  };
};