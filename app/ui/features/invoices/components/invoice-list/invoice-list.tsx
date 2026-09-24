import { Link } from "react-router";

import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import ui from "../../../../styles/product.module.css";
import styles from "./invoice-list.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const dueDateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

interface InvoiceListProps {
  invoices: InvoiceSummary[];
}

function formatStatus(status: InvoiceSummary["status"]) {
  switch (status) {
    case "draft":
      return "Draft";

    case "issued":
      return "Issued";

    case "voided":
      return "Voided";
  }
}

export default function InvoiceList({ invoices }: InvoiceListProps) {
  return (
    <div
      className={ui.tableScroll}
      role="region"
      aria-label="Invoices"
      tabIndex={0}
    >
      <table className={ui.table} aria-label="Invoices">
        <thead>
          <tr>
            <th scope="col">Invoice</th>
            <th scope="col">Customer</th>
            <th scope="col">Jobs</th>
            <th scope="col">Status</th>
            <th scope="col">Due</th>
            <th scope="col" className={ui.numeric}>
              Total
            </th>
            <th scope="col">Details</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <th scope="row" className={styles.invoice}>
                <Link to={`/invoices/${invoice.id}`}>
                  {invoice.invoiceNumber ?? "Draft invoice"}
                </Link>
              </th>

              <td className={styles.customer}>
                <Link to={`/customers/${invoice.customerId}`}>
                  {invoice.customerName}
                </Link>
              </td>

              <td className={styles.jobs}>
                {invoice.jobs.length ? (
                  <ul>
                    {invoice.jobs.map((job) => (
                      <li key={job.id}>
                        <Link to={`/jobs/${job.id}`}>{job.name}</Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className={styles.missing}>—</span>
                )}
              </td>

              <td>
                <span className={ui[invoice.status]}>
                  {formatStatus(invoice.status)}
                </span>
              </td>

              <td className={styles.date}>
                {invoice.dueDate ? (
                  <time dateTime={invoice.dueDate}>
                    {dueDateFormatter.format(
                      new Date(`${invoice.dueDate}T00:00:00Z`),
                    )}
                  </time>
                ) : (
                  <span className={styles.missing}>—</span>
                )}
              </td>

              <td className={ui.numeric}>
                {currencyFormatter.format(invoice.totalCents / 100)}
              </td>

              <td className={ui.view}>
                <Link
                  to={`/invoices/${invoice.id}`}
                  aria-label={`View ${
                    invoice.invoiceNumber ?? "draft invoice"
                  }`}
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
