import Link from "next/link";
import type { JobListFilter } from "@shared";
import { getJobs } from "@/lib/api/jobs";
import { formatDate } from "@/lib/format/date";

const jobFilterOptions = [
  { value: "Scheduled", label: "Scheduled" },
  { value: "Completed", label: "Completed" },
  { value: "Invoiced", label: "Invoiced" },
  { value: "All", label: "All" }
] as const;

type JobsPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

function isJobListFilter(value: string | undefined): value is JobListFilter {
  return jobFilterOptions.some((option) => option.value === value);
}

function buildJobsHref(filter: JobListFilter): string {
  const params = new URLSearchParams();
  params.set("filter", filter);
  return `/jobs?${params.toString()}`;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const resolvedSearchParams = await searchParams;

  const filter = isJobListFilter(resolvedSearchParams.filter)
    ? resolvedSearchParams.filter
    : undefined;

  const jobList = await getJobs({ filter });

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
        <h1 style={{ margin: 0 }}>Jobs</h1>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {jobFilterOptions.map((option) => {
            const isActive = option.value === jobList.defaultFilter;

            return (
              <Link
                key={option.value}
                href={buildJobsHref(option.value)}
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
          {jobList.items.map((job) => (
            <tr key={job.id}>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {job.customerName}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {formatDate(job.serviceDate)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                <Link href={`/jobs/${job.id}`}>{job.serviceType}</Link>
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {job.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}