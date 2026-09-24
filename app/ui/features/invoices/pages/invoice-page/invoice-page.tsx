import { Form, Link, useNavigation } from "react-router";

import type { InvoiceDetailResult } from "../../../../../server/features/invoices/types/invoice-detail-result";
import type { InvoiceItemSummary } from "../../../../../server/features/invoices/types/invoice-item-summary";
import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import Icon from "../../../../components/icon/icon";
import ui from "../../../../styles/product.module.css";
import InvoicePayments from "../../components/invoice-payments/invoice-payments";
import styles from "./invoice-page.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Australia/Melbourne",
});

const calendarDateFormatter = new Intl.DateTimeFormat("en-AU", {
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

  const jobsById = new Map(invoice.jobs.map((job) => [job.id, job]));

  return (
    <section className={ui.page}>
      <div className={styles.breadcrumb}>
        <Link className={ui.breadcrumb} to="/invoices">
          Invoices
        </Link>

        <span aria-hidden="true">›</span>

        <span>{invoice.invoiceNumber ?? "Draft invoice"}</span>
      </div>

      <header className={ui.header}>
        <div>
          <div className={styles.title}>
            <h1 className="page-title">
              {invoice.invoiceNumber ?? "Draft invoice"}
            </h1>

            <span className={ui[invoice.status]}>
              {formatStatus(invoice.status)}
            </span>
          </div>

          <p className={styles.context}>
            <Link to={`/customers/${invoice.customerId}`}>
              {invoice.customerName}
            </Link>

            <span aria-hidden="true">·</span>

            {invoice.issuedAt !== null ? (
              <span>
                Issued{" "}
                <time dateTime={new Date(invoice.issuedAt).toISOString()}>
                  {dateFormatter.format(new Date(invoice.issuedAt))}
                </time>
              </span>
            ) : (
              <span>
                Created{" "}
                <time dateTime={new Date(invoice.createdAt).toISOString()}>
                  {dateFormatter.format(new Date(invoice.createdAt))}
                </time>
              </span>
            )}
          </p>
        </div>

        {canManage && invoice.status === "draft" && (
          <div className={styles.headerActions}>
            <Link
              className={ui.primaryAction}
              to={`/invoices/${invoice.id}/issue`}
            >
              <Icon name="invoice" />
              Issue invoice
            </Link>

            <Link
              className={ui.secondaryAction}
              to={`/invoices/${invoice.id}/edit`}
            >
              <Icon name="edit" />
              Edit draft
            </Link>
          </div>
        )}
      </header>

      <dl className={styles.metrics}>
        <div>
          <dt>Invoice total</dt>
          <dd>{currencyFormatter.format(invoice.totalCents / 100)}</dd>
        </div>

        <div>
          <dt>Paid</dt>
          <dd>{currencyFormatter.format(invoice.paidCents / 100)}</dd>
        </div>

        <div>
          <dt>
            {invoice.status === "voided" ? "Historical balance" : "Outstanding"}
          </dt>
          <dd>{currencyFormatter.format(invoice.balanceCents / 100)}</dd>
        </div>
      </dl>

      <div className={styles.detailsGrid}>
        <section
          className={styles.section}
          aria-labelledby="invoice-information-heading"
        >
          <header className={ui.sectionHeading}>
            <span className={ui.iconCircle}>
              <Icon name="invoice" />
            </span>

            <div>
              <h2 id="invoice-information-heading">Invoice information</h2>
              <p>Dates and lifecycle details for this invoice.</p>
            </div>
          </header>

          <dl className={styles.detailList}>
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
                  {calendarDateFormatter.format(
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

        <section
          className={styles.section}
          aria-labelledby="invoice-jobs-heading"
        >
          <header className={ui.sectionHeading}>
            <span className={ui.iconCircle}>
              <Icon name="jobs" />
            </span>

            <div>
              <h2 id="invoice-jobs-heading">Jobs</h2>
              <p>Work included on this invoice.</p>
            </div>
          </header>

          <ul className={styles.jobs}>
            {invoice.jobs.map((job) => (
              <li key={job.id}>
                <div>
                  <Link to={`/jobs/${job.id}`}>{job.name}</Link>

                  <span>
                    Scheduled{" "}
                    {calendarDateFormatter.format(
                      new Date(`${job.scheduledDate}T00:00:00Z`),
                    )}
                  </span>
                </div>

                <Link className={styles.viewAction} to={`/jobs/${job.id}`}>
                  View job
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section
        className={styles.section}
        aria-labelledby="invoice-items-heading"
      >
        <header className={styles.sectionHeader}>
          <div className={ui.sectionHeading}>
            <span className={ui.iconCircle}>
              <Icon name="finance" />
            </span>

            <div>
              <h2 id="invoice-items-heading">Invoice items</h2>
              <p>Charges included in the invoice total.</p>
            </div>
          </div>

          {canManage && invoice.status === "draft" && (
            <Link
              className={ui.secondaryAction}
              to={`/invoices/${invoice.id}/items/new`}
            >
              <Icon name="plus" />
              Add item
            </Link>
          )}
        </header>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>No invoice items have been added yet.</p>
          </div>
        ) : (
          <div
            className={ui.tableScroll}
            role="region"
            aria-label="Invoice items"
            tabIndex={0}
          >
            <table className={ui.table}>
              <thead>
                <tr>
                  <th scope="col">Job</th>
                  <th scope="col">Description</th>
                  <th scope="col" className={ui.numeric}>
                    Amount
                  </th>

                  {canManage && invoice.status === "draft" && (
                    <th scope="col">
                      <span className={styles.visuallyHidden}>Actions</span>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const job = jobsById.get(item.jobId);

                  return (
                    <tr key={item.id}>
                      <td>
                        {job ? (
                          <Link to={`/jobs/${job.id}`}>{job.name}</Link>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>{item.description}</td>

                      <td className={ui.numeric}>
                        {currencyFormatter.format(item.amountCents / 100)}
                      </td>

                      {canManage && invoice.status === "draft" && (
                        <td className={styles.itemActions}>
                          <Link
                            className={styles.tableAction}
                            to={`/invoices/${invoice.id}/items/${item.id}/edit`}
                          >
                            Edit
                          </Link>

                          <details className={styles.itemDanger}>
                            <summary>Delete</summary>

                            <div className={styles.itemDangerBody}>
                              <p>
                                Delete this invoice item? This cannot be undone.
                              </p>

                              <Form
                                method="post"
                                action={`/invoices/${invoice.id}/items/${item.id}/delete`}
                              >
                                <button
                                  className={ui.dangerAction}
                                  type="submit"
                                  disabled={submitting}
                                >
                                  Confirm delete item
                                </button>
                              </Form>
                            </div>
                          </details>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.invoiceTotal}>
          <span>Invoice total</span>

          <strong>{currencyFormatter.format(invoice.totalCents / 100)}</strong>
        </div>
      </section>

      <InvoicePayments
        invoice={invoice}
        payments={payments}
        canManage={canManage}
      />

      {canManage &&
        (invoice.status === "draft" || invoice.status === "issued") && (
          <section
            className={styles.dangerZone}
            aria-labelledby="invoice-danger-heading"
          >
            <span className={styles.dangerIcon}>
              <Icon name="danger" />
            </span>

            <div className={styles.dangerCopy}>
              <h2 id="invoice-danger-heading">Danger zone</h2>

              {invoice.status === "draft" ? (
                <p>
                  Delete this draft invoice permanently. Jobs assigned to the
                  draft will become available for invoicing again.
                </p>
              ) : (
                <p>
                  Void this invoice while preserving it in the financial
                  history.
                </p>
              )}
            </div>

            {invoice.status === "draft" ? (
              <details className={styles.dangerConfirmation}>
                <summary>Delete draft</summary>

                <div className={styles.dangerConfirmationBody}>
                  <p>Delete this draft invoice? This cannot be undone.</p>

                  <Form method="post" action={`/invoices/${invoice.id}/delete`}>
                    <button
                      className={ui.dangerAction}
                      type="submit"
                      disabled={submitting}
                    >
                      Confirm delete
                    </button>
                  </Form>
                </div>
              </details>
            ) : (
              <details className={styles.dangerConfirmation}>
                <summary>Void invoice</summary>

                <div className={styles.dangerConfirmationBody}>
                  <p>
                    Void {invoice.invoiceNumber}? The invoice will remain in the
                    financial history.
                  </p>

                  <Form method="post" action={`/invoices/${invoice.id}/void`}>
                    <button
                      className={ui.dangerAction}
                      type="submit"
                      disabled={submitting}
                    >
                      Confirm void
                    </button>
                  </Form>
                </div>
              </details>
            )}
          </section>
        )}
    </section>
  );
}
