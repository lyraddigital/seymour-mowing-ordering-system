import type { CustomerDetailDto } from "@shared";

const customerDetails: Record<string, CustomerDetailDto> = {
  "cust-1": {
    id: "cust-1",
    name: "Smith Residence",
    email: "smith@example.com",
    phone: "0400 111 222",
    billingAddress: "12 High Street, Wallan VIC 3756",
    serviceAddress: "12 High Street, Wallan VIC 3756",
    suburb: "Wallan",
    notes: "Prefers Friday mornings. Side gate unlocked.",
    recentInvoices: [
      {
        id: "inv-1",
        invoiceNumber: "INV-1001",
        customerName: "Smith Residence",
        totalIncGst: 220,
        balanceDue: 220,
        issueDate: "2026-04-10",
        dueDate: "2026-04-24",
        status: "Sent"
      }
    ],
    recentJobs: [
      {
        id: "job-1",
        customerName: "Smith Residence",
        serviceDate: "2026-04-18",
        serviceType: "Lawn Mowing",
        status: "Scheduled"
      }
    ]
  },
  "cust-2": {
    id: "cust-2",
    name: "Jones Property",
    email: "jones@example.com",
    phone: "0400 222 333",
    billingAddress: "5 Main Road, Wandong VIC 3758",
    serviceAddress: "5 Main Road, Wandong VIC 3758",
    suburb: "Wandong",
    notes: "Dog in backyard. Call ahead before arrival.",
    recentInvoices: [
      {
        id: "inv-2",
        invoiceNumber: "INV-1002",
        customerName: "Jones Property",
        totalIncGst: 180,
        balanceDue: 0,
        issueDate: "2026-04-09",
        dueDate: "2026-04-23",
        status: "Paid"
      }
    ],
    recentJobs: [
      {
        id: "job-2",
        customerName: "Jones Property",
        serviceDate: "2026-04-16",
        serviceType: "Garden Cleanup",
        status: "Completed"
      }
    ]
  },
  "cust-3": {
    id: "cust-3",
    name: "Greenvale Childcare",
    email: "admin@greenvalechildcare.com.au",
    phone: "03 9000 1234",
    billingAddress: "22 Centre Road, Greenvale VIC 3059",
    serviceAddress: "22 Centre Road, Greenvale VIC 3059",
    suburb: "Greenvale",
    notes: "Invoice to accounts email. Work outside pick-up hours when possible.",
    recentInvoices: [
      {
        id: "inv-3",
        invoiceNumber: "INV-1003",
        customerName: "Greenvale Childcare",
        totalIncGst: 495,
        balanceDue: 495,
        issueDate: "2026-04-12",
        dueDate: "2026-04-26",
        status: "Overdue"
      }
    ],
    recentJobs: [
      {
        id: "job-3",
        customerName: "Greenvale Childcare",
        serviceDate: "2026-04-19",
        serviceType: "Garden Maintenance",
        status: "Scheduled"
      }
    ]
  },
  "cust-4": {
    id: "cust-4",
    name: "Brown Family Home",
    email: "brown@example.com",
    phone: "0400 333 444",
    billingAddress: "9 Willow Drive, Craigieburn VIC 3064",
    serviceAddress: "9 Willow Drive, Craigieburn VIC 3064",
    suburb: "Craigieburn",
    notes: "Monthly hedge work.",
    recentInvoices: [
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
    ],
    recentJobs: [
      {
        id: "job-4",
        customerName: "Brown Family Home",
        serviceDate: "2026-04-14",
        serviceType: "Hedge Trimming",
        status: "Invoiced"
      }
    ]
  }
};

export function getMockCustomerDetail(id: string): CustomerDetailDto | null {
  return customerDetails[id] ?? null;
}