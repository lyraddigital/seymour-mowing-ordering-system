import type {
  InvoiceAgingState,
  InvoiceListDto,
  InvoiceListFilter
} from "@shared";

type InvoiceSummaryDto = InvoiceListDto["items"][number];

type GetMockInvoicesParams = {
  filter?: InvoiceListFilter;
};

const NOW = new Date("2026-04-16T12:00:00Z");

const allInvoices: InvoiceSummaryDto[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-1001",
    customerName: "Smith Residence",
    totalIncGst: 220,
    balanceDue: 220,
    issueDate: "2026-04-10",
    dueDate: "2026-04-15",
    status: "Sent",
    agingState: "LateUnder7Days"
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-1002",
    customerName: "Jones Property",
    totalIncGst: 180,
    balanceDue: 0,
    issueDate: "2026-04-09",
    dueDate: "2026-04-23",
    status: "Paid",
    agingState: "NotDue"
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-1003",
    customerName: "Greenvale Childcare",
    totalIncGst: 495,
    balanceDue: 495,
    issueDate: "2026-04-12",
    dueDate: "2026-04-14",
    status: "Overdue",
    agingState: "Late7PlusDays"
  },
  {
    id: "inv-4",
    invoiceNumber: "INV-1004",
    customerName: "Brown Family Home",
    totalIncGst: 150,
    balanceDue: 150,
    issueDate: "2026-04-14",
    dueDate: "2026-04-28",
    status: "Draft",
    agingState: "NotDue"
  },
  {
    id: "inv-5",
    invoiceNumber: "INV-1005",
    customerName: "Taylor Residence",
    totalIncGst: 320,
    balanceDue: 320,
    issueDate: "2026-04-16",
    dueDate: "2026-04-17",
    status: "Sent",
    agingState: "DueToday"
  }
];

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

function isBetween(target: Date, start: Date, end: Date): boolean {
  return target >= start && target <= end;
}

function getUnpaidInvoices(invoices: InvoiceSummaryDto[]): InvoiceSummaryDto[] {
  return invoices.filter((invoice) => invoice.balanceDue > 0);
}

function filterInvoices(
  invoices: InvoiceSummaryDto[],
  filter: InvoiceListFilter
): InvoiceSummaryDto[] {
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
          invoice.agingState === "LateUnder7Days" ||
          invoice.agingState === "Late7PlusDays"
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

function sortInvoices(invoices: InvoiceSummaryDto[]): InvoiceSummaryDto[] {
  return [...invoices].sort((a, b) => {
    const agingDiff = agingPriority(a.agingState) - agingPriority(b.agingState);

    if (agingDiff !== 0) {
      return agingDiff;
    }

    return parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime();
  });
}

export function getMockInvoices(
  params: GetMockInvoicesParams = {}
): InvoiceListDto {
  const filter = params.filter ?? "AllUnpaid";

  const unpaidInvoices = getUnpaidInvoices(allInvoices);
  const filteredInvoices = filterInvoices(unpaidInvoices, filter);
  const sortedInvoices = sortInvoices(filteredInvoices);

  return {
    defaultFilter: filter,
    items: sortedInvoices
  };
}