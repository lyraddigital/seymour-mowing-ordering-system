import { Link } from "react-router";

import type { InvoiceItemSummary } from "../../../../../server/features/invoices/types/invoice-item-summary";
import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import styles from "./invoice-page.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const scheduledDateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

interface InvoicePageProps {
  invoice: InvoiceSummary;
  items: InvoiceItemSummary[];
  canManage: boolean;
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

export default function InvoicePage({ invoice, items }: InvoicePageProps) {
  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to="/invoices">
        ← Invoices
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className="page-title">
            {invoice.invoiceNumber ?? "Draft invoice"}
          </h1>

          <p className={styles.intro}>Invoice details</p>
        </div>

        <span className={`${styles.status} ${styles[invoice.status]}`}>
          {formatStatus(invoice.status)}
        </span>
      </header>

      <div className={styles.detailsGrid}>
        <section className={styles.detailCard}>
          <h2>Invoice</h2>

          <dl className={styles.detailList}>
            <div>
              <dt>Customer</dt>
              <dd>
                <Link to={`/customers/${invoice.customerId}`}>
                  {invoice.customerName}
                </Link>
              </dd>
            </div>

            <div>
              <dt>Created</dt>
              <dd>{dateFormatter.format(new Date(invoice.createdAt))}</dd>
            </div>

            {invoice.issuedAt && (
              <div>
                <dt>Issued</dt>
                <dd>{dateFormatter.format(new Date(invoice.issuedAt))}</dd>
              </div>
            )}

            {invoice.voidedAt && (
              <div>
                <dt>Voided</dt>
                <dd>{dateFormatter.format(new Date(invoice.voidedAt))}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className={styles.detailCard}>
          <h2>Jobs</h2>

          <ul className={styles.jobs}>
            {invoice.jobs.map((job) => (
              <li key={job.id}>
                <Link to={`/jobs/${job.id}`}>{job.name}</Link>

                <span>
                  {scheduledDateFormatter.format(
                    new Date(`${job.scheduledDate}T00:00:00Z`),
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={styles.itemsSection}>
        <h2>Invoice items</h2>

        {invoice.jobs.map((job) => {
          const jobItems = items.filter((item) => item.jobId === job.id);

          return (
            <section className={styles.jobItems} key={job.id}>
              <header className={styles.jobItemsHeader}>
                <div>
                  <h3>{job.name}</h3>

                  <span>
                    {scheduledDateFormatter.format(
                      new Date(`${job.scheduledDate}T00:00:00Z`),
                    )}
                  </span>
                </div>
              </header>

              {jobItems.length ? (
                <ul className={styles.items}>
                  {jobItems.map((item) => (
                    <li key={item.id}>
                      <span>{item.description}</span>

                      <strong>
                        {currencyFormatter.format(item.amountCents / 100)}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noItems}>
                  No invoice items from this job.
                </p>
              )}
            </section>
          );
        })}

        <div className={styles.total}>
          <span>Total</span>

          <strong>{currencyFormatter.format(invoice.totalCents / 100)}</strong>
        </div>
      </section>
    </section>
  );
}
