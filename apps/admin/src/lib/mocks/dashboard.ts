import type { DashboardDto } from "@shared";

export const mockDashboard: DashboardDto = {
  scheduledJobsDefaultPeriod: "ThisWeek",
  completedJobsDefaultPeriod: "Last7Days",
  unpaidInvoicesDefaultFilter: "AllUnpaid",

  scheduledJobsCount: 2,
  completedJobsCount: 2,
  unpaidInvoicesCount: 3,
  unpaidInvoicesTotal: 865,

  scheduledJobs: [
    {
      id: "job-1",
      customerName: "Smith Residence",
      serviceDate: "2026-04-18",
      serviceType: "Lawn Mowing",
      status: "Scheduled"
    },
    {
      id: "job-3",
      customerName: "Greenvale Childcare",
      serviceDate: "2026-04-19",
      serviceType: "Garden Maintenance",
      status: "Scheduled"
    }
  ],

  recentlyCompletedJobs: [
    {
      id: "job-2",
      customerName: "Jones Property",
      serviceDate: "2026-04-16",
      serviceType: "Garden Cleanup",
      status: "Completed"
    },
    {
      id: "job-5",
      customerName: "Taylor Residence",
      serviceDate: "2026-04-15",
      serviceType: "Weeding",
      status: "Completed"
    }
  ],

  unpaidInvoices: [
    {
      id: "inv-3",
      invoiceNumber: "INV-1003",
      customerName: "Greenvale Childcare",
      issueDate: "2026-04-12",
      dueDate: "2026-04-14",
      totalIncGst: 495,
      balanceDue: 495,
      status: "Overdue",
      agingState: "Late7PlusDays"
    },
    {
      id: "inv-1",
      invoiceNumber: "INV-1001",
      customerName: "Smith Residence",
      issueDate: "2026-04-10",
      dueDate: "2026-04-15",
      totalIncGst: 220,
      balanceDue: 220,
      status: "Sent",
      agingState: "LateUnder7Days"
    },
    {
      id: "inv-4",
      invoiceNumber: "INV-1004",
      customerName: "Brown Family Home",
      issueDate: "2026-04-14",
      dueDate: "2026-04-28",
      totalIncGst: 150,
      balanceDue: 150,
      status: "Draft",
      agingState: "NotDue"
    }
  ]
};