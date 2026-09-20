import { Form, Link, useNavigation } from "react-router";

import type { InvoiceItemValidationError } from "../../../../../server/features/invoices/errors/invoice-item-validation-error";
import type { InvoiceItemSummary } from "../../../../../server/features/invoices/types/invoice-item-summary";
import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import styles from "./edit-invoice-item-page.module.css";

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

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to={`/invoices/${invoice.id}`}>
        ← Invoice details
      </Link>

      <header className={styles.header}>
        <h1 className="page-title">Edit invoice item</h1>
        <p className={styles.intro}>
          Update work or a charge for {invoice.customerName}.
        </p>
      </header>

      <Form method="post" className={styles.form} aria-busy={saving}>
        <p>Job: {invoice.jobs.find((job) => job.id === item.jobId)?.name}</p>
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
                fieldErrors?.description ? "description-error" : undefined
              }
            />

            {fieldErrors?.description && (
              <p
                className={styles.fieldError}
                id="description-error"
                role="alert"
              >
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="amount">Amount</label>

            <div className={styles.moneyField}>
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
                  fieldErrors?.amountCents ? "amount-error" : undefined
                }
              />
            </div>

            {fieldErrors?.amountCents && (
              <p className={styles.fieldError} id="amount-error" role="alert">
                {fieldErrors.amountCents}
              </p>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.primaryAction}
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
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
