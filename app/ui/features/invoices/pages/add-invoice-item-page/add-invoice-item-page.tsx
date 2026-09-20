import { Form, Link, useNavigation } from "react-router";

import type { InvoiceItemValidationError } from "../../../../../server/features/invoices/errors/invoice-item-validation-error";
import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import styles from "./add-invoice-item-page.module.css";

interface AddInvoiceItemFormValues {
  jobId: string;
  description: string;
  amount: string;
}

interface AddInvoiceItemPageProps {
  invoice: InvoiceSummary;
  values?: AddInvoiceItemFormValues;
  fieldErrors?: InvoiceItemValidationError["fieldErrors"];
}

export default function AddInvoiceItemPage({
  invoice,
  values,
  fieldErrors,
}: AddInvoiceItemPageProps) {
  const saving = useNavigation().state !== "idle";

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to={`/invoices/${invoice.id}`}>
        ← Invoice details
      </Link>

      <header className={styles.header}>
        <h1 className="page-title">Add invoice item</h1>
        <p className={styles.intro}>
          Add work or a charge to {invoice.customerName}.
        </p>
      </header>

      <Form method="post" className={styles.form} aria-busy={saving}>
        <div className={styles.fields}>
          <div className={styles.fullField}>
            {invoice.jobs.length === 1 ? (
              <>
                <p>Job: {invoice.jobs[0].name}</p>
                <input type="hidden" name="jobId" value={invoice.jobs[0].id} />
              </>
            ) : (
              <>
                <label htmlFor="jobId">Job</label>
                <select
                  id="jobId"
                  name="jobId"
                  required
                  defaultValue={values?.jobId ?? ""}
                  aria-invalid={!!fieldErrors?.jobId}
                  aria-describedby={
                    fieldErrors?.jobId ? "job-error" : undefined
                  }
                >
                  <option value="">Choose a job</option>
                  {invoice.jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.name} ({job.scheduledDate})
                    </option>
                  ))}
                </select>
              </>
            )}
            {fieldErrors?.jobId && (
              <p className={styles.fieldError} id="job-error" role="alert">
                {fieldErrors.jobId}
              </p>
            )}
          </div>
          <div className={styles.fullField}>
            <label htmlFor="description">Description</label>
            <input
              id="description"
              name="description"
              type="text"
              maxLength={500}
              required
              defaultValue={values?.description ?? ""}
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
                placeholder="0.00"
                required
                defaultValue={values?.amount ?? ""}
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
            {saving ? "Saving…" : "Add item"}
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
