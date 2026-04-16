import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceDetail } from "@/lib/api/invoice-detail";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";

type InvoiceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InvoiceDetailPage({
  params
}: InvoiceDetailPageProps) {
  const { id } = await params;

  try {
    const invoice = await getInvoiceDetail(id);

    return (
      <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
        <nav style={{ marginBottom: "16px", display: "flex", gap: "16px" }}>
          <Link href="/">Dashboard</Link>
          <Link href="/invoices">Invoices</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/jobs">Jobs</Link>
        </nav>

        <h1>Invoice {invoice.invoiceNumber}</h1>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginTop: "24px"
          }}
        >
          <div style={{ border: "1px solid #ccc", padding: "16px" }}>
            <h2 style={{ marginTop: 0 }}>Invoice details</h2>
            <p><strong>Status:</strong> {invoice.status}</p>
            <p><strong>Issue date:</strong> {formatDate(invoice.issueDate)}</p>
            <p><strong>Due date:</strong> {formatDate(invoice.dueDate)}</p>
          </div>

          <div style={{ border: "1px solid #ccc", padding: "16px" }}>
            <h2 style={{ marginTop: 0 }}>Customer</h2>
            <p><strong>Name:</strong> {invoice.customer.name}</p>
            <p><strong>Email:</strong> {invoice.customer.email ?? "-"}</p>
            <p><strong>Phone:</strong> {invoice.customer.phone ?? "-"}</p>
          </div>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>Line items</h2>
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
              {invoice.items.map((item) => (
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

        <section
          style={{
            marginTop: "32px",
            maxWidth: "400px",
            marginLeft: "auto",
            border: "1px solid #ccc",
            padding: "16px"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Totals</h2>
          <p><strong>Subtotal ex GST:</strong> {formatCurrency(invoice.subtotalExGst)}</p>
          <p><strong>GST:</strong> {formatCurrency(invoice.gstAmount)}</p>
          <p><strong>Total inc GST:</strong> {formatCurrency(invoice.totalIncGst)}</p>
          <p><strong>Balance due:</strong> {formatCurrency(invoice.balanceDue)}</p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>Payments</h2>
          {invoice.payments.length === 0 ? (
            <p>No payments recorded.</p>
          ) : (
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                    Paid date
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                    Amount
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                    Method
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {formatDate(payment.paidDate)}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {payment.method}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {payment.reference ?? "-"}
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