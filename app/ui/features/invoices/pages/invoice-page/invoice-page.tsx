import { Form, Link, useNavigation } from "react-router";

import InvoicePayments from "../../components/invoice-payments/invoice-payments";
import type { InvoiceDetailResult } from "../../../../../server/features/invoices/types/invoice-detail-result";
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
  invoice: InvoiceDetailResult["invoice"];
  payments: InvoiceDetailResult["payments"];
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

export default function InvoicePage({
  invoice,
  items,
  payments,
  canManage,
}: InvoicePageProps) {
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";

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

      {canManage && invoice.status === "draft" && (
        <div className={styles.actions}>
          <Link
            className={styles.primaryAction}
            to={`/invoices/${invoice.id}/issue`}
          >
            Issue invoice
          </Link>

          <Link
            className={styles.secondaryAction}
            to={`/invoices/${invoice.id}/edit`}
          >
            Edit draft
          </Link>

          <details className={styles.dangerConfirmation}>
            <summary>Delete draft</summary>

            <div className={styles.dangerConfirmationBody}>
              <p>Delete this draft invoice? This cannot be undone.</p>

              <Form method="post" action={`/invoices/${invoice.id}/delete`}>
                <button
                  className={styles.dangerAction}
                  type="submit"
                  disabled={submitting}
                >
                  Confirm delete
                </button>
              </Form>
            </div>
          </details>
        </div>
      )}

      {canManage && invoice.status === "issued" && (
        <div className={styles.actions}>
          <details className={styles.dangerConfirmation}>
            <summary>Void invoice</summary>

            <div className={styles.dangerConfirmationBody}>
              <p>
                Void {invoice.invoiceNumber}? The invoice will remain in the
                financial history.
              </p>

              <Form method="post" action={`/invoices/${invoice.id}/void`}>
                <button
                  className={styles.dangerAction}
                  type="submit"
                  disabled={submitting}
                >
                  Confirm void
                </button>
              </Form>
            </div>
          </details>
        </div>
      )}

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

            {invoice.issuedAt !== null && (
              <div>
                <dt>Issued</dt>
                <dd>{dateFormatter.format(new Date(invoice.issuedAt))}</dd>
              </div>
            )}

            {invoice.dueDate !== null && (
              <div>
                <dt>Due</dt>
                <dd>
                  {scheduledDateFormatter.format(
                    new Date(`${invoice.dueDate}T00:00:00Z`),
                  )}
                </dd>
              </div>
            )}

            {invoice.voidedAt !== null && (
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
        <div className={styles.itemsHeader}>
          <h2>Invoice items</h2>
          {canManage && invoice.status === "draft" && (
            <Link
              className={styles.secondaryAction}
              to={`/invoices/${invoice.id}/items/new`}
            >
              Add item
            </Link>
          )}
        </div>

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

              {jobItems.length > 0 ? (
                <ul className={styles.items}>
                  {jobItems.map((item) => (
                    <li key={item.id}>
                      <span>{item.description}</span>

                      <strong>
                        {currencyFormatter.format(item.amountCents / 100)}
                      </strong>
                      {canManage && invoice.status === "draft" && (
                        <div className={styles.itemActions}>
                          <Link
                            className={styles.secondaryAction}
                            to={`/invoices/${invoice.id}/items/${item.id}/edit`}
                          >
                            Edit
                          </Link>
                          <details className={styles.dangerConfirmation}>
                            <summary>Delete</summary>
                            <div className={styles.dangerConfirmationBody}>
                              <p>
                                Delete this invoice item? This cannot be undone.
                              </p>
                              <Form
                                method="post"
                                action={`/invoices/${invoice.id}/items/${item.id}/delete`}
                              >
                                <button
                                  className={styles.dangerAction}
                                  type="submit"
                                  disabled={submitting}
                                >
                                  Confirm delete item
                                </button>
                              </Form>
                            </div>
                          </details>
                        </div>
                      )}
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
      <InvoicePayments
        invoice={invoice}
        payments={payments}
        canManage={canManage}
      />
    </section>
  );
}
