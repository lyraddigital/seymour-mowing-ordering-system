import { Form, Link, useNavigation } from "react-router";

import type { InvoiceDetailResult } from "../../../../../server/features/invoices/types/invoice-detail-result";
import type { IssueInvoiceFieldErrors } from "../../../../../server/features/invoices/types/issue-invoice-input";
import styles from "./issue-invoice-page.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

interface IssueInvoicePageProps {
  invoice: InvoiceDetailResult["invoice"];
  values?: {
    dueDate: string;
  };
  fieldErrors?: IssueInvoiceFieldErrors;
}

export default function IssueInvoicePage({
  invoice,
  values,
  fieldErrors,
}: IssueInvoicePageProps) {
  const saving = useNavigation().state !== "idle";

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to={`/invoices/${invoice.id}`}>
        ← Invoice details
      </Link>

      <header className={styles.header}>
        <h1 className="page-title">Issue invoice</h1>

        <p className={styles.intro}>
          Set the payment due date before issuing this invoice.
        </p>
      </header>

      <dl className={styles.context}>
        <div>
          <dt>Customer</dt>
          <dd>{invoice.customerName}</dd>
        </div>

        <div>
          <dt>Invoice total</dt>
          <dd>{currencyFormatter.format(invoice.totalCents / 100)}</dd>
        </div>
      </dl>

      <Form method="post" className={styles.form} aria-busy={saving}>
        <div>
          <label htmlFor="dueDate">Due date</label>

          <input
            id="dueDate"
            name="dueDate"
            type="date"
            required
            defaultValue={values?.dueDate ?? ""}
            aria-invalid={!!fieldErrors?.dueDate}
            aria-describedby={
              fieldErrors?.dueDate ? "due-date-error" : "due-date-hint"
            }
          />

          {fieldErrors?.dueDate ? (
            <p className={styles.fieldError} id="due-date-error" role="alert">
              {fieldErrors.dueDate}
            </p>
          ) : (
            <p className={styles.fieldHint} id="due-date-hint">
              The Dashboard will use this date to determine when the invoice is
              overdue.
            </p>
          )}
        </div>

        <p className={styles.issueHint}>
          Issuing the invoice assigns its invoice number and locks the draft
          from further editing.
        </p>

        <div className={styles.actions}>
          <button
            className={styles.primaryAction}
            type="submit"
            disabled={saving}
          >
            {saving ? "Issuing…" : "Issue invoice"}
          </button>

          <Link
            className={styles.secondaryAction}
            to={`/invoices/${invoice.id}`}
          >
            Cancel
          </Link>
        </div>
      </Form>
    </section>
  );
}
