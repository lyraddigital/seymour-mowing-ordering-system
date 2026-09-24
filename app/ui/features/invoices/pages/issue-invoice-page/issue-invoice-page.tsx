import { Form, Link, useNavigation } from "react-router";

import type {
  IssueInvoiceFieldErrors,
  IssueInvoiceInput,
} from "../../../../../server/features/invoices/types/issue-invoice-input";
import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import ui from "../../../../styles/product.module.css";
import styles from "./issue-invoice-page.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

interface IssueInvoicePageProps {
  invoice: InvoiceSummary;
  values?: IssueInvoiceInput;
  fieldErrors?: IssueInvoiceFieldErrors;
}

export default function IssueInvoicePage({
  invoice,
  values,
  fieldErrors,
}: IssueInvoicePageProps) {
  const saving = useNavigation().state !== "idle";

  return (
    <section className={`${ui.page} ${styles.page}`}>
      <div className={styles.breadcrumb}>
        <Link className={ui.breadcrumb} to="/invoices">
          Invoices
        </Link>

        <span aria-hidden="true">›</span>

        <Link className={ui.breadcrumb} to={`/invoices/${invoice.id}`}>
          Draft invoice
        </Link>

        <span aria-hidden="true">›</span>
        <span>Issue</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">Issue invoice</h1>

          <p className={ui.intro}>
            Set the payment due date and issue this draft to{" "}
            {invoice.customerName}.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <Form method="post" className={styles.form} aria-busy={saving}>
          <section
            className={styles.formSection}
            aria-labelledby="payment-terms-heading"
          >
            <header className={styles.sectionHeader}>
              <h2 id="payment-terms-heading">Payment terms</h2>

              <p>The due date is required before the invoice can be issued.</p>
            </header>

            <div className={styles.field}>
              <label htmlFor="dueDate">Due date</label>

              <input
                id="dueDate"
                name="dueDate"
                type="date"
                min="0001-01-01"
                max="9999-12-31"
                required
                defaultValue={values?.dueDate ?? ""}
                aria-invalid={!!fieldErrors?.dueDate}
                aria-describedby={
                  fieldErrors?.dueDate ? "dueDate-error" : "dueDate-hint"
                }
              />

              {fieldErrors?.dueDate ? (
                <p
                  id="dueDate-error"
                  className={styles.fieldError}
                  role="alert"
                >
                  {fieldErrors.dueDate}
                </p>
              ) : (
                <p id="dueDate-hint" className={styles.fieldHint}>
                  This date will be shown on the issued invoice and used to
                  determine when an unpaid balance becomes overdue.
                </p>
              )}
            </div>
          </section>

          <section
            className={styles.warning}
            aria-labelledby="issue-warning-heading"
          >
            <h2 id="issue-warning-heading">Issuing finalises the draft</h2>

            <p>
              Once issued, the invoice number and due date are fixed and the
              draft can no longer be edited or deleted. Payments can then be
              recorded against the invoice.
            </p>
          </section>

          <footer className={styles.actions}>
            <button
              className={ui.primaryAction}
              type="submit"
              disabled={saving}
            >
              {saving ? "Issuing…" : "Issue invoice"}
            </button>

            <Link className={ui.secondaryAction} to={`/invoices/${invoice.id}`}>
              Cancel
            </Link>

            <span className={styles.savingStatus} role="status">
              {saving ? "Issuing invoice…" : ""}
            </span>
          </footer>
        </Form>

        <aside
          className={styles.summary}
          aria-labelledby="invoice-summary-heading"
        >
          <h2 id="invoice-summary-heading">Invoice summary</h2>

          <dl>
            <div>
              <dt>Customer</dt>
              <dd>{invoice.customerName}</dd>
            </div>

            <div>
              <dt>Jobs</dt>
              <dd>
                {invoice.jobs.length}{" "}
                {invoice.jobs.length === 1 ? "job" : "jobs"}
              </dd>
            </div>

            <div className={styles.total}>
              <dt>Invoice total</dt>
              <dd>{currencyFormatter.format(invoice.totalCents / 100)}</dd>
            </div>
          </dl>

          {invoice.jobs.length > 0 && (
            <div className={styles.jobs}>
              <h3>Included jobs</h3>

              <ul>
                {invoice.jobs.map((job) => (
                  <li key={job.id}>
                    <Link to={`/jobs/${job.id}`}>{job.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
