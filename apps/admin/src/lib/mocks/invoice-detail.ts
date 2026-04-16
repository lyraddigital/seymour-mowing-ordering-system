import type { InvoiceDetailDto } from "@shared";

const invoiceDetails: Record<string, InvoiceDetailDto> = {
  "inv-1": {
    id: "inv-1",
    invoiceNumber: "INV-1001",
    issueDate: "2026-04-10",
    dueDate: "2026-04-24",
    status: "Sent",
    customer: {
      id: "cust-1",
      name: "Smith Residence",
      email: "smith@example.com",
      phone: "0400 111 222"
    },
    items: [
      {
        id: "item-1",
        description: "Lawn mowing",
        qty: 1,
        unitPriceExGst: 100,
        lineTotalExGst: 100
      },
      {
        id: "item-2",
        description: "Edging",
        qty: 1,
        unitPriceExGst: 50,
        lineTotalExGst: 50
      },
      {
        id: "item-3",
        description: "Green waste removal",
        qty: 1,
        unitPriceExGst: 50,
        lineTotalExGst: 50
      }
    ],
    payments: [],
    subtotalExGst: 200,
    gstAmount: 20,
    totalIncGst: 220,
    balanceDue: 220
  },
  "inv-2": {
    id: "inv-2",
    invoiceNumber: "INV-1002",
    issueDate: "2026-04-09",
    dueDate: "2026-04-23",
    status: "Paid",
    customer: {
      id: "cust-2",
      name: "Jones Property",
      email: "jones@example.com",
      phone: "0400 222 333"
    },
    items: [
      {
        id: "item-4",
        description: "Garden cleanup",
        qty: 1,
        unitPriceExGst: 120,
        lineTotalExGst: 120
      },
      {
        id: "item-5",
        description: "Hedge trimming",
        qty: 1,
        unitPriceExGst: 43.64,
        lineTotalExGst: 43.64
      }
    ],
    payments: [
      {
        id: "pay-1",
        paidDate: "2026-04-15",
        amount: 180,
        method: "Bank Transfer",
        reference: "INV1002"
      }
    ],
    subtotalExGst: 163.64,
    gstAmount: 16.36,
    totalIncGst: 180,
    balanceDue: 0
  }
};

export function getMockInvoiceDetail(id: string): InvoiceDetailDto | null {
  return invoiceDetails[id] ?? null;
}