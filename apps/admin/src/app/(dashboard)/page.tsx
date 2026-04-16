import Link from "next/link";
import type {
  CompletedJobPeriod,
  InvoiceAgingState,
  ScheduledJobPeriod,
  UnpaidInvoiceFilter
} from "@shared";
import { getDashboard } from "@/lib/api/dashboard";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";

const scheduledJobPeriodOptions = [
  { value: "ThisWeek", label: "This Week" },
  { value: "ThisMonth", label: "This Month" },
  { value: "ThisYear", label: "This Year" },
  { value: "AllUpcoming", label: "All Upcoming" }
] as const;

const completedJobPeriodOptions = [
  { value: "Last7Days", label: "Last 7 Days" },
  { value: "Last30Days", label: "Last 30 Days" },
  { value: "Last12Months", label: "Last 12 Months" }
] as const;

const unpaidInvoiceFilterOptions = [
  { value: "AllUnpaid", label: "All Unpaid" },
  { value: "DueThisWeek", label: "Due This Week" },
  { value: "LateOnly", label: "Late Only" },
  { value: "LateUnder7Days", label: "Late < 7 Days" },
  { value: "Late7PlusDays", label: "Late 7+ Days" }
] as const;

type HomePageProps = {
  searchParams: Promise<{
    scheduledPeriod?: string;
    completedPeriod?: string;
    invoiceFilter?: string;
  }>;
};

function isScheduledJobPeriod(value: string | undefined): value is ScheduledJobPeriod {
  return scheduledJobPeriodOptions.some((option) => option.value === value);
}

function isCompletedJobPeriod(value: string | undefined): value is CompletedJobPeriod {
  return completedJobPeriodOptions.some((option) => option.value === value);
}

function isUnpaidInvoiceFilter(value: string | undefined): value is UnpaidInvoiceFilter {
  return unpaidInvoiceFilterOptions.some((option) => option.value === value);
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

function buildDashboardHref(filters: {
  scheduledPeriod?: ScheduledJobPeriod;
  completedPeriod?: CompletedJobPeriod;
  invoiceFilter?: UnpaidInvoiceFilter;
}): string {
  const params = new URLSearchParams();

  if (filters.scheduledPeriod) {
    params.set("scheduledPeriod", filters.scheduledPeriod);
  }

  if (filters.completedPeriod) {
    params.set("completedPeriod", filters.completedPeriod);
  }

  if (filters.invoiceFilter) {
    params.set("invoiceFilter", filters.invoiceFilter);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;

  const scheduledPeriod = isScheduledJobPeriod(resolvedSearchParams.scheduledPeriod)
    ? resolvedSearchParams.scheduledPeriod
    : undefined;

  const completedPeriod = isCompletedJobPeriod(resolvedSearchParams.completedPeriod)
    ? resolvedSearchParams.completedPeriod
    : undefined;

  const invoiceFilter = isUnpaidInvoiceFilter(resolvedSearchParams.invoiceFilter)
    ? resolvedSearchParams.invoiceFilter
    : undefined;

  const dashboard = await getDashboard({
    scheduledPeriod,
    completedPeriod,
    invoiceFilter
  });

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <h1>Seymour Mowing Admin</h1>

      <nav style={{ marginTop: "16px", display: "flex", gap: "16px" }}>
        <Link href="/">Dashboard</Link>
        <Link href="/invoices">Invoices</Link>
        <Link href="/customers">Customers</Link>
        <Link href="/jobs">Jobs</Link>
      </nav>

      <section style={{ display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "220px" }}>
          <h2 style={{ marginTop: 0 }}>Scheduled jobs</h2>
          <p style={{ margin: "0 0 8px 0" }}>{dashboard.scheduledJobsDefaultPeriod}</p>
          <p style={{ fontSize: "28px", marginBottom: 0 }}>{dashboard.scheduledJobsCount}</p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "220px" }}>
          <h2 style={{ marginTop: 0 }}>Completed jobs</h2>
          <p style={{ margin: "0 0 8px 0" }}>{dashboard.completedJobsDefaultPeriod}</p>
          <p style={{ fontSize: "28px", marginBottom: 0 }}>{dashboard.completedJobsCount}</p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "220px" }}>
          <h2 style={{ marginTop: 0 }}>Unpaid invoices</h2>
          <p style={{ margin: "0 0 8px 0" }}>Outstanding count</p>
          <p style={{ fontSize: "28px", marginBottom: 0 }}>{dashboard.unpaidInvoicesCount}</p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "220px" }}>
          <h2 style={{ marginTop: 0 }}>Unpaid total</h2>
          <p style={{ margin: "0 0 8px 0" }}>Outstanding balance</p>
          <p style={{ fontSize: "28px", marginBottom: 0 }}>
            {formatCurrency(dashboard.unpaidInvoicesTotal)}
          </p>
        </div>
      </section>

      <section style={{ marginTop: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px"
          }}
        >
          <h2 style={{ margin: 0 }}>Scheduled jobs</h2>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {scheduledJobPeriodOptions.map((option) => {
              const isActive = option.value === dashboard.scheduledJobsDefaultPeriod;

              return (
                <Link
                  key={option.value}
                  href={buildDashboardHref({
                    scheduledPeriod: option.value,
                    completedPeriod: dashboard.completedJobsDefaultPeriod,
                    invoiceFilter: dashboard.unpaidInvoicesDefaultFilter
                  })}
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

        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                Customer
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                Service date
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                Service type
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {dashboard.scheduledJobs.map((job) => (
              <tr key={job.id}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  {job.customerName}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  {formatDate(job.serviceDate)}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  {job.serviceType}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  {job.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px"
          }}
        >
          <h2 style={{ margin: 0 }}>Recently completed jobs</h2>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {completedJobPeriodOptions.map((option) => {
              const isActive = option.value === dashboard.completedJobsDefaultPeriod;

              return (
                <Link
                  key={option.value}
                  href={buildDashboardHref({
                    scheduledPeriod: dashboard.scheduledJobsDefaultPeriod,
                    completedPeriod: option.value,
                    invoiceFilter: dashboard.unpaidInvoicesDefaultFilter
                  })}
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

        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                Customer
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                Service date
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                Service type
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {dashboard.recentlyCompletedJobs.map((job) => (
              <tr key={job.id}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  {job.customerName}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  {formatDate(job.serviceDate)}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  {job.serviceType}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  {job.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px"
          }}
        >
          <h2 style={{ margin: 0 }}>Unpaid invoices</h2>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {unpaidInvoiceFilterOptions.map((option) => {
              const isActive = option.value === dashboard.unpaidInvoicesDefaultFilter;

              return (
                <Link
                  key={option.value}
                  href={buildDashboardHref({
                    scheduledPeriod: dashboard.scheduledJobsDefaultPeriod,
                    completedPeriod: dashboard.completedJobsDefaultPeriod,
                    invoiceFilter: option.value
                  })}
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

        <table style={{ borderCollapse: "collapse", width: "100%" }}>
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
                Balance due
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                Aging
              </th>
            </tr>
          </thead>
          <tbody>
            {dashboard.unpaidInvoices.map((invoice) => (
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
                  {formatCurrency(invoice.balanceDue)}
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
      </section>
    </main>
  );
}