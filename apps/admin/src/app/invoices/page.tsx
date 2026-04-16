import Link from "next/link";
import type { InvoiceAgingState, InvoiceListFilter } from "@shared";
import { getInvoices } from "@/lib/api/invoices";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";

const invoiceFilterOptions = [
  { value: "AllUnpaid", label: "All Unpaid" },
  { value: "DueThisWeek", label: "Due This Week" },
  { value: "LateOnly", label: "Late Only" },
  { value: "LateUnder7Days", label: "Late < 7 Days" },
  { value: "Late7PlusDays", label: "Late 7+ Days" }
] as const;

type InvoicesPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

function isInvoiceListFilter(value: string | undefined): value is InvoiceListFilter {
  return invoiceFilterOptions.some((option) => option.value === value);
}

function buildInvoicesHref(filter: InvoiceListFilter): string {
  const params = new URLSearchParams();
  params.set("filter", filter);
  return `/invoices?${params.toString()}`;
}

function getAgingLabel(agingState: InvoiceAgingState): string {
  switch (agingState) {
    case "NotDue":
      return "Not due";
    case "DueToday":
      return "Due today";
    case "LateUnder7Days":
      return "Late < 7 days";
    case "Late7PlusDays":
      return "Late 7+ days";
  }
}

function getAgingStyle(agingState: InvoiceAgingState): React.CSSProperties {
  switch (agingState) {
    case "NotDue":
      return {
        backgroundColor: "#f3f4f6",
        color: "#111827",
        padding: "4px 8px",
        borderRadius: "999px",
        display: "inline-block"
      };
    case "DueToday":
      return {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        padding: "4px 8px",
        borderRadius: "999px",
        display: "inline-block"
      };
    case "LateUnder7Days":
      return {
        backgroundColor: "#fde68a",
        color: "#92400e",
        padding: "4px 8px",
        borderRadius: "999px",
        display: "inline-block"
      };
    case "Late7PlusDays":
      return {
        backgroundColor: "#fecaca",
        color: "#991b1b",
        padding: "4px 8px",
        borderRadius: "999px",
        display: "inline-block"
      };
  }
}

export default async function InvoicesPage({
  searchParams
}: InvoicesPageProps) {
  const resolvedSearchParams = await searchParams;

  const filter = isInvoiceListFilter(resolvedSearchParams.filter)
    ? resolvedSearchParams.filter
    : undefined;

  const invoiceList = await getInvoices({ filter });

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <nav style={{ marginBottom: "16px", display: "flex", gap: "16px" }}>
        <Link href="/">Dashboard</Link>
        <Link href="/invoices">Invoices</Link>
        <Link href="/customers">Customers</Link>
        <Link href="/jobs">Jobs</Link>
      </nav>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
        }}
      >
        <h1 style={{ margin: 0 }}>Invoices</h1>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {invoiceFilterOptions.map((option) => {
            const isActive = option.value === invoiceList.defaultFilter;

            return (
              <Link
                key={option.value}
                href={buildInvoicesHref(option.value)}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  textDecoration: "none",
                  color: "#111827",
                  backgroundColor: isActive ? "#e5e7eb" : "#ffffff"
                }}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "24px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Invoice
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Customer
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Issue date
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Due date
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Total
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Balance due
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Status
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Aging
            </th>
          </tr>
        </thead>
        <tbody>
          {invoiceList.items.map((invoice) => (
            <tr key={invoice.id}>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                <Link href={`/invoices/${invoice.id}`}>{invoice.invoiceNumber}</Link>
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {invoice.customerName}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {formatDate(invoice.issueDate)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {formatDate(invoice.dueDate)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {formatCurrency(invoice.totalIncGst)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {formatCurrency(invoice.balanceDue)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {invoice.status}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                <span style={getAgingStyle(invoice.agingState)}>
                  {getAgingLabel(invoice.agingState)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}