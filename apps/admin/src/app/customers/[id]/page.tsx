import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/lib/api/customer-detail";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";

type CustomerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerDetailPage({
  params
}: CustomerDetailPageProps) {
  const { id } = await params;

  try {
    const customer = await getCustomerDetail(id);

    return (
      <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
        <nav style={{ marginBottom: "16px", display: "flex", gap: "16px" }}>
          <Link href="/">Dashboard</Link>
          <Link href="/invoices">Invoices</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/jobs">Jobs</Link>
        </nav>

        <h1>{customer.name}</h1>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginTop: "24px"
          }}
        >
          <div style={{ border: "1px solid #ccc", padding: "16px" }}>
            <h2 style={{ marginTop: 0 }}>Contact</h2>
            <p><strong>Email:</strong> {customer.email ?? "-"}</p>
            <p><strong>Phone:</strong> {customer.phone ?? "-"}</p>
            <p><strong>Suburb:</strong> {customer.suburb ?? "-"}</p>
          </div>

          <div style={{ border: "1px solid #ccc", padding: "16px" }}>
            <h2 style={{ marginTop: 0 }}>Addresses</h2>
            <p><strong>Billing:</strong> {customer.billingAddress ?? "-"}</p>
            <p><strong>Service:</strong> {customer.serviceAddress ?? "-"}</p>
          </div>
        </section>

        <section style={{ marginTop: "24px", border: "1px solid #ccc", padding: "16px" }}>
          <h2 style={{ marginTop: 0 }}>Notes</h2>
          <p>{customer.notes ?? "No notes recorded."}</p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>Recent invoices</h2>
          {customer.recentInvoices.length === 0 ? (
            <p>No invoices found.</p>
          ) : (
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                    Invoice
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
                </tr>
              </thead>
              <tbody>
                {customer.recentInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      <Link href={`/invoices/${invoice.id}`}>{invoice.invoiceNumber}</Link>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>Recent jobs</h2>
          {customer.recentJobs.length === 0 ? (
            <p>No jobs found.</p>
          ) : (
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
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
                {customer.recentJobs.map((job) => (
                  <tr key={job.id}>
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
          )}
        </section>
      </main>
    );
  } catch {
    notFound();
  }
}