import type {
  CompletedJobPeriod,
  DashboardDto,
  InvoiceAgingState,
  ScheduledJobPeriod,
  UnpaidInvoiceFilter
} from "@shared";

type ScheduledJobSummaryDto = DashboardDto["scheduledJobs"][number];
type CompletedJobSummaryDto = DashboardDto["recentlyCompletedJobs"][number];
type UnpaidInvoiceSummaryDto = DashboardDto["unpaidInvoices"][number];

type GetMockDashboardParams = {
  scheduledPeriod?: ScheduledJobPeriod;
  completedPeriod?: CompletedJobPeriod;
  invoiceFilter?: UnpaidInvoiceFilter;
};

const allScheduledJobs: ScheduledJobSummaryDto[] = [
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
  },
  {
    id: "job-6",
    customerName: "Brown Family Home",
    serviceDate: "2026-04-27",
    serviceType: "Hedge Trimming",
    status: "Scheduled"
  },
  {
    id: "job-7",
    customerName: "Taylor Residence",
    serviceDate: "2026-10-03",
    serviceType: "Weeding",
    status: "Scheduled"
  }
];

const allCompletedJobs: CompletedJobSummaryDto[] = [
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
  },
  {
    id: "job-8",
    customerName: "Smith Residence",
    serviceDate: "2026-03-28",
    serviceType: "Mulching",
    status: "Completed"
  },
  {
    id: "job-9",
    customerName: "Greenvale Childcare",
    serviceDate: "2025-08-12",
    serviceType: "Garden Maintenance",
    status: "Completed"
  }
];

const allUnpaidInvoices: UnpaidInvoiceSummaryDto[] = [
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
  },
  {
    id: "inv-5",
    invoiceNumber: "INV-1005",
    customerName: "Taylor Residence",
    issueDate: "2026-04-16",
    dueDate: "2026-04-17",
    totalIncGst: 320,
    balanceDue: 320,
    status: "Sent",
    agingState: "DueToday"
  }
];

const NOW = new Date("2026-04-16T12:00:00Z");

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function startOfYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

function endOfYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
}

function daysAgo(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() - days);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function monthsAgo(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, date.getUTCDate()));
}

function isBetween(target: Date, start: Date, end: Date): boolean {
  return target >= start && target <= end;
}

function filterScheduledJobs(
  jobs: ScheduledJobSummaryDto[],
  period: ScheduledJobPeriod
): ScheduledJobSummaryDto[] {
  return jobs.filter((job) => {
    const serviceDate = parseDate(job.serviceDate);

    switch (period) {
      case "ThisWeek":
        return isBetween(serviceDate, startOfWeek(NOW), endOfWeek(NOW));
      case "ThisMonth":
        return isBetween(serviceDate, startOfMonth(NOW), endOfMonth(NOW));
      case "ThisYear":
        return isBetween(serviceDate, startOfYear(NOW), endOfYear(NOW));
      case "AllUpcoming":
        return serviceDate >= NOW;
    }
  });
}

function filterCompletedJobs(
  jobs: CompletedJobSummaryDto[],
  period: CompletedJobPeriod
): CompletedJobSummaryDto[] {
  return jobs.filter((job) => {
    const serviceDate = parseDate(job.serviceDate);

    switch (period) {
      case "Last7Days":
        return serviceDate >= daysAgo(NOW, 7) && serviceDate <= NOW;
      case "Last30Days":
        return serviceDate >= daysAgo(NOW, 30) && serviceDate <= NOW;
      case "Last12Months":
        return serviceDate >= monthsAgo(NOW, 12) && serviceDate <= NOW;
    }
  });
}

function filterUnpaidInvoices(
  invoices: UnpaidInvoiceSummaryDto[],
  filter: UnpaidInvoiceFilter
): UnpaidInvoiceSummaryDto[] {
  switch (filter) {
    case "AllUnpaid":
      return invoices;

    case "DueThisWeek":
      return invoices.filter((invoice) => {
        const dueDate = parseDate(invoice.dueDate);
        return isBetween(dueDate, startOfWeek(NOW), endOfWeek(NOW));
      });

    case "LateOnly":
      return invoices.filter(
        (invoice) =>
          invoice.agingState === "LateUnder7Days" || invoice.agingState === "Late7PlusDays"
      );

    case "LateUnder7Days":
      return invoices.filter((invoice) => invoice.agingState === "LateUnder7Days");

    case "Late7PlusDays":
      return invoices.filter((invoice) => invoice.agingState === "Late7PlusDays");
  }
}

function agingPriority(agingState: InvoiceAgingState): number {
  switch (agingState) {
    case "Late7PlusDays":
      return 0;
    case "LateUnder7Days":
      return 1;
    case "DueToday":
      return 2;
    case "NotDue":
      return 3;
  }
}

function sortUnpaidInvoices(invoices: UnpaidInvoiceSummaryDto[]): UnpaidInvoiceSummaryDto[] {
  return [...invoices].sort((a, b) => {
    const agingDiff = agingPriority(a.agingState) - agingPriority(b.agingState);

    if (agingDiff !== 0) {
      return agingDiff;
    }

    return parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime();
  });
}

export function getMockDashboard(
  params: GetMockDashboardParams = {}
): DashboardDto {
  const scheduledPeriod = params.scheduledPeriod ?? "ThisWeek";
  const completedPeriod = params.completedPeriod ?? "Last7Days";
  const invoiceFilter = params.invoiceFilter ?? "AllUnpaid";

  const scheduledJobs = filterScheduledJobs(allScheduledJobs, scheduledPeriod);
  const recentlyCompletedJobs = filterCompletedJobs(allCompletedJobs, completedPeriod);
  const unpaidInvoices = sortUnpaidInvoices(
    filterUnpaidInvoices(allUnpaidInvoices, invoiceFilter)
  );

  const unpaidInvoicesTotal = unpaidInvoices.reduce(
    (sum, invoice) => sum + invoice.balanceDue,
    0
  );

  return {
    scheduledJobsDefaultPeriod: scheduledPeriod,
    completedJobsDefaultPeriod: completedPeriod,
    unpaidInvoicesDefaultFilter: invoiceFilter,

    scheduledJobsCount: scheduledJobs.length,
    completedJobsCount: recentlyCompletedJobs.length,
    unpaidInvoicesCount: unpaidInvoices.length,
    unpaidInvoicesTotal,

    scheduledJobs,
    recentlyCompletedJobs,
    unpaidInvoices
  };
}