import { Form, Link, useNavigation } from "react-router";

import type { InvoiceItemValidationError } from "../../../../../server/features/invoices/errors/invoice-item-validation-error";
import type { InvoiceItemSummary } from "../../../../../server/features/invoices/types/invoice-item-summary";
import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import ui from "../../../../styles/product.module.css";
import styles from "./edit-invoice-item-page.module.css";

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

interface EditInvoiceItemFormValues {
  description: string;
  amount: string;
}

interface EditInvoiceItemPageProps {
  invoice: InvoiceSummary;
  item: InvoiceItemSummary;
  values?: EditInvoiceItemFormValues;
  fieldErrors?: InvoiceItemValidationError["fieldErrors"];
}

export default function EditInvoiceItemPage({
  invoice,
  item,
  values,
  fieldErrors,
}: EditInvoiceItemPageProps) {
  const saving = useNavigation().state !== "idle";

  const formValues = values ?? {
    description: item.description,
    amount: (item.amountCents / 100).toFixed(2),
  };

  const job = invoice.jobs.find((job) => job.id === item.jobId);

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
        <span>Edit item</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">Edit invoice item</h1>

          <p className={ui.intro}>
            Update this charge for {invoice.customerName}.
          </p>
        </div>
      </header>

      <Form method="post" className={styles.form} aria-busy={saving}>
        <section
          className={styles.formSection}
          aria-labelledby="item-details-heading"
        >
          <header className={styles.sectionHeader}>
            <h2 id="item-details-heading">Item details</h2>

            <p>
              The linked job cannot be changed after the invoice item is
              created.
            </p>
          </header>

          <div className={styles.readOnlyGroup}>
            <span className={styles.readOnlyLabel}>Job</span>

            <div className={styles.readOnlyField}>
              {job ? (
                <div>
                  <Link to={`/jobs/${job.id}`}>{job.name}</Link>

                  <span>
                    Scheduled{" "}
                    {dateFormatter.format(
                      new Date(`${job.scheduledDate}T00:00:00Z`),
                    )}
                  </span>
                </div>
              ) : (
                <strong>Linked job</strong>
              )}
            </div>
          </div>

          <div className={styles.fields}>
            <div className={styles.fullField}>
              <label htmlFor="description">Description</label>

              <input
                id="description"
                name="description"
                type="text"
                maxLength={500}
                required
                defaultValue={formValues.description}
                aria-invalid={!!fieldErrors?.description}
                aria-describedby={
                  fieldErrors?.description
                    ? "description-error"
                    : "description-hint"
                }
              />

              {fieldErrors?.description ? (
                <p
                  className={styles.fieldError}
                  id="description-error"
                  role="alert"
                >
                  {fieldErrors.description}
                </p>
              ) : (
                <p className={styles.fieldHint} id="description-hint">
                  This description appears in the invoice item list.
                </p>
              )}
            </div>

            <div className={styles.amountField}>
              <label htmlFor="amount">Amount</label>

              <div
                className={`${styles.moneyField} ${
                  fieldErrors?.amountCents ? styles.moneyFieldError : ""
                }`}
              >
                <span aria-hidden="true">$</span>

                <input
                  id="amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  required
                  defaultValue={formValues.amount}
                  aria-invalid={!!fieldErrors?.amountCents}
                  aria-describedby={
                    fieldErrors?.amountCents ? "amount-error" : "amount-hint"
                  }
                />
              </div>

              {fieldErrors?.amountCents ? (
                <p className={styles.fieldError} id="amount-error" role="alert">
                  {fieldErrors.amountCents}
                </p>
              ) : (
                <p className={styles.fieldHint} id="amount-hint">
                  Enter the charge in Australian dollars.
                </p>
              )}
            </div>
          </div>
        </section>

        <footer className={styles.actions}>
          <button className={ui.primaryAction} type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>

          <Link className={ui.secondaryAction} to={`/invoices/${invoice.id}`}>
            Cancel
          </Link>

          <span className={styles.savingStatus} role="status">
            {saving ? "Saving invoice item…" : ""}
          </span>
        </footer>
      </Form>
    </section>
  );
}
