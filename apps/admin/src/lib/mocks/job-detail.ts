import type { JobDetailDto } from "@shared";

const jobDetails: Record<string, JobDetailDto> = {
  "job-1": {
    id: "job-1",
    customer: {
      id: "cust-1",
      name: "Smith Residence"
    },
    serviceDate: "2026-04-18",
    serviceType: "Lawn Mowing",
    status: "Scheduled",
    serviceAddress: "12 High Street, Wallan VIC 3756",
    notes: "Front and back lawns. Please blow off driveway after mowing.",
    items: [
      {
        id: "job-item-1",
        description: "Lawn mowing",
        qty: 1,
        unitPriceExGst: 100,
        lineTotalExGst: 100
      },
      {
        id: "job-item-2",
        description: "Edging",
        qty: 1,
        unitPriceExGst: 50,
        lineTotalExGst: 50
      }
    ]
  },
  "job-2": {
    id: "job-2",
    customer: {
      id: "cust-2",
      name: "Jones Property"
    },
    serviceDate: "2026-04-16",
    serviceType: "Garden Cleanup",
    status: "Completed",
    serviceAddress: "5 Main Road, Wandong VIC 3758",
    notes: "Leaf removal and tidy front beds.",
    items: [
      {
        id: "job-item-3",
        description: "Garden cleanup",
        qty: 1,
        unitPriceExGst: 120,
        lineTotalExGst: 120
      }
    ]
  },
  "job-3": {
    id: "job-3",
    customer: {
      id: "cust-3",
      name: "Greenvale Childcare"
    },
    serviceDate: "2026-04-19",
    serviceType: "Garden Maintenance",
    status: "Scheduled",
    serviceAddress: "22 Centre Road, Greenvale VIC 3059",
    notes: "Please avoid pick-up period.",
    items: [
      {
        id: "job-item-4",
        description: "Garden maintenance",
        qty: 1,
        unitPriceExGst: 300,
        lineTotalExGst: 300
      },
      {
        id: "job-item-5",
        description: "Green waste removal",
        qty: 1,
        unitPriceExGst: 150,
        lineTotalExGst: 150
      }
    ]
  },
  "job-4": {
    id: "job-4",
    customer: {
      id: "cust-4",
      name: "Brown Family Home"
    },
    serviceDate: "2026-04-14",
    serviceType: "Hedge Trimming",
    status: "Invoiced",
    serviceAddress: "9 Willow Drive, Craigieburn VIC 3064",
    notes: "Trim side hedges and remove clippings.",
    items: [
      {
        id: "job-item-6",
        description: "Hedge trimming",
        qty: 1,
        unitPriceExGst: 136.36,
        lineTotalExGst: 136.36
      }
    ],
    linkedInvoice: {
      id: "inv-4",
      invoiceNumber: "INV-1004",
      status: "Draft"
    }
  }
};

export function getMockJobDetail(id: string): JobDetailDto | null {
  return jobDetails[id] ?? null;
}