import { Link } from "react-router";

import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import styles from "./invoice-list.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
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
    <ul className={styles.list} aria-label="Invoices">
      {invoices.map((invoice) => (
        <li className={styles.invoice} key={invoice.id}>
          <div className={styles.identity}>
            <h2 className={styles.invoiceNumber}>
              <Link
                className={styles.invoiceLink}
                to={`/invoices/${invoice.id}`}
              >
                {invoice.invoiceNumber ?? "Draft invoice"}
              </Link>
            </h2>

            <span className={`${styles.status} ${styles[invoice.status]}`}>
              {formatStatus(invoice.status)}
            </span>
          </div>

          <div className={styles.context}>
            <div>
              <span className={styles.label}>Customer</span>

              <Link to={`/customers/${invoice.customerId}`}>
                {invoice.customerName}
              </Link>
            </div>

            <div>
              <span className={styles.label}>
                {invoice.jobs.length === 1 ? "Job" : "Jobs"}
              </span>

              <ul className={styles.jobs}>
                {invoice.jobs.map((job) => (
                  <li key={job.id}>
                    <Link to={`/jobs/${job.id}`}>{job.name}</Link>

                    <span className={styles.jobDate}>{job.scheduledDate}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.summary}>
            <div>
              <span className={styles.label}>Created</span>

              <span>{dateFormatter.format(new Date(invoice.createdAt))}</span>
            </div>

            <div>
              <span className={styles.label}>Total</span>

              <strong className={styles.total}>
                {currencyFormatter.format(invoice.totalCents / 100)}
              </strong>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
