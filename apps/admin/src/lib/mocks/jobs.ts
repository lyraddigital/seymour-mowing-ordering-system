import type { JobListDto, JobListFilter } from "@shared";

type JobSummaryDto = JobListDto["items"][number];

type GetMockJobsParams = {
  filter?: JobListFilter;
};

const allJobs: JobSummaryDto[] = [
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
  },
  {
    id: "job-5",
    customerName: "Taylor Residence",
    serviceDate: "2026-04-15",
    serviceType: "Weeding",
    status: "Completed"
  },
  {
    id: "job-6",
    customerName: "Brown Family Home",
    serviceDate: "2026-04-27",
    serviceType: "Hedge Trimming",
    status: "Scheduled"
  }
];

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function filterJobs(jobs: JobSummaryDto[], filter: JobListFilter): JobSummaryDto[] {
  switch (filter) {
    case "All":
      return jobs;
    case "Scheduled":
      return jobs.filter((job) => job.status === "Scheduled");
    case "Completed":
      return jobs.filter((job) => job.status === "Completed");
    case "Invoiced":
      return jobs.filter((job) => job.status === "Invoiced");
  }
}

function sortJobs(jobs: JobSummaryDto[]): JobSummaryDto[] {
  return [...jobs].sort(
    (a, b) => parseDate(a.serviceDate).getTime() - parseDate(b.serviceDate).getTime()
  );
}

export function getMockJobs(params: GetMockJobsParams = {}): JobListDto {
  const filter = params.filter ?? "Scheduled";
  const filteredJobs = filterJobs(allJobs, filter);
  const sortedJobs = sortJobs(filteredJobs);

  return {
    defaultFilter: filter,
    items: sortedJobs
  };
}