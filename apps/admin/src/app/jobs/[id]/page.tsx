import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobDetail } from "@/lib/api/job-detail";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";

type JobDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function JobDetailPage({
  params
}: JobDetailPageProps) {
  const { id } = await params;

  try {
    const job = await getJobDetail(id);

    return (
      <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
        <nav style={{ marginBottom: "16px", display: "flex", gap: "16px" }}>
          <Link href="/">Dashboard</Link>
          <Link href="/invoices">Invoices</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/jobs">Jobs</Link>
        </nav>

        <h1>{job.serviceType}</h1>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginTop: "24px"
          }}
        >
          <div style={{ border: "1px solid #ccc", padding: "16px" }}>
            <h2 style={{ marginTop: 0 }}>Job details</h2>
            <p>
              <strong>Customer:</strong>{" "}
              <Link href={`/customers/${job.customer.id}`}>{job.customer.name}</Link>
            </p>
            <p><strong>Service date:</strong> {formatDate(job.serviceDate)}</p>
            <p><strong>Status:</strong> {job.status}</p>
            <p><strong>Service address:</strong> {job.serviceAddress ?? "-"}</p>
          </div>

          <div style={{ border: "1px solid #ccc", padding: "16px" }}>
            <h2 style={{ marginTop: 0 }}>Invoice</h2>
            {job.linkedInvoice ? (
              <>
                <p>
                  <strong>Invoice:</strong>{" "}
                  <Link href={`/invoices/${job.linkedInvoice.id}`}>
                    {job.linkedInvoice.invoiceNumber}
                  </Link>
                </p>
                <p><strong>Status:</strong> {job.linkedInvoice.status}</p>
              </>
            ) : (
              <p>No invoice linked yet.</p>
            )}
          </div>
        </section>

        <section style={{ marginTop: "24px", border: "1px solid #ccc", padding: "16px" }}>
          <h2 style={{ marginTop: 0 }}>Notes</h2>
          <p>{job.notes ?? "No notes recorded."}</p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>Job items</h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                  Description
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                  Qty
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                  Unit price ex GST
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                  Line total ex GST
                </th>
              </tr>
            </thead>
            <tbody>
              {job.items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                    {item.description}
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                    {item.qty}
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                    {formatCurrency(item.unitPriceExGst)}
                  </td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                    {formatCurrency(item.lineTotalExGst)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    );
  } catch {
    notFound();
  }
}