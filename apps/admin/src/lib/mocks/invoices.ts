import type { InvoiceListDto } from "@shared";

export const mockInvoices: InvoiceListDto = {
  items: [
    {
      id: "inv-1",
      invoiceNumber: "INV-1001",
      customerName: "Smith Residence",
      totalIncGst: 220,
      balanceDue: 220,
      issueDate: "2026-04-10",
      dueDate: "2026-04-24",
      status: "Sent"
    },
    {
      id: "inv-2",
      invoiceNumber: "INV-1002",
      customerName: "Jones Property",
      totalIncGst: 180,
      balanceDue: 0,
      issueDate: "2026-04-09",
      dueDate: "2026-04-23",
      status: "Paid"
    },
    {
      id: "inv-3",
      invoiceNumber: "INV-1003",
      customerName: "Greenvale Childcare",
      totalIncGst: 495,
      balanceDue: 495,
      issueDate: "2026-04-12",
      dueDate: "2026-04-26",
      status: "Overdue"
    },
    {
      id: "inv-4",
      invoiceNumber: "INV-1004",
      customerName: "Brown Family Home",
      totalIncGst: 150,
      balanceDue: 150,
      issueDate: "2026-04-14",
      dueDate: "2026-04-28",
      status: "Draft"
    }
  ]
};