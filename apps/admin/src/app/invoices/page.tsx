import { getInvoices } from "@/lib/api/invoices";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import Link from "next/dist/client/link";

export default async function InvoicesPage() {
  const invoiceList = await getInvoices();

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <h1>Invoices</h1>

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
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}