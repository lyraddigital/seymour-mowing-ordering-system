import type { DashboardDto } from "@shared";

export const mockDashboard: DashboardDto = {
  outstandingInvoicesCount: 3,
  outstandingInvoicesTotal: 1240,
  completedUninvoicedJobsCount: 2,
  upcomingJobs: [
    {
      id: "job-1",
      customerName: "Smith Residence",
      serviceDate: "2026-04-18",
      status: "Scheduled"
    },
    {
      id: "job-2",
      customerName: "Greenvale Childcare",
      serviceDate: "2026-04-19",
      status: "Scheduled"
    }
  ],
  recentInvoices: [
    {
      id: "inv-1",
      invoiceNumber: "INV-1001",
      customerName: "Smith Residence",
      totalIncGst: 220,
      balanceDue: 220,
      status: "Sent"
    },
    {
      id: "inv-2",
      invoiceNumber: "INV-1002",
      customerName: "Jones Property",
      totalIncGst: 180,
      balanceDue: 0,
      status: "Paid"
    }
  ]
};