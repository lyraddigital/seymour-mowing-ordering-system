import { getDashboard } from "@/lib/api/dashboard";

export default async function HomePage() {
  const dashboard = await getDashboard();

  return (
    <main style={{ padding: "24px" }}>
      <h1>Seymour Mowing Admin</h1>

      <section style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
        <div>
          <h2>Outstanding invoices</h2>
          <p>{dashboard.outstandingInvoicesCount}</p>
        </div>

        <div>
          <h2>Outstanding total</h2>
          <p>${dashboard.outstandingInvoicesTotal.toFixed(2)}</p>
        </div>

        <div>
          <h2>Completed not invoiced</h2>
          <p>{dashboard.completedUninvoicedJobsCount}</p>
        </div>
      </section>

      <section style={{ marginTop: "32px" }}>
        <h2>Upcoming jobs</h2>
        <ul>
          {dashboard.upcomingJobs.map((job) => (
            <li key={job.id}>
              {job.customerName} - {job.serviceDate} - {job.status}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "32px" }}>
        <h2>Recent invoices</h2>
        <ul>
          {dashboard.recentInvoices.map((invoice) => (
            <li key={invoice.id}>
              {invoice.invoiceNumber} - {invoice.customerName} - $
              {invoice.totalIncGst.toFixed(2)} - {invoice.status}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}