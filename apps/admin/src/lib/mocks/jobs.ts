import type { JobListDto } from "@shared";

export const mockJobs: JobListDto = {
  items: [
    {
      id: "job-1",
      customerName: "Smith Residence",
      serviceDate: "2026-04-18",
      serviceType: "Lawn Mowing",
      status: "Scheduled"
    },
    {
      id: "job-2",
      customerName: "Jones Property",
      serviceDate: "2026-04-16",
      serviceType: "Garden Cleanup",
      status: "Completed"
    },
    {
      id: "job-3",
      customerName: "Greenvale Childcare",
      serviceDate: "2026-04-19",
      serviceType: "Garden Maintenance",
      status: "Scheduled"
    },
    {
      id: "job-4",
      customerName: "Brown Family Home",
      serviceDate: "2026-04-14",
      serviceType: "Hedge Trimming",
      status: "Invoiced"
    }
  ]
};