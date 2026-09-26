import { Form, Link, useNavigation } from "react-router";

import type { InvoiceItemValidationError } from "../../../../../server/features/invoices/errors/invoice-item-validation-error";
import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import ui from "../../../../styles/product.module.css";
import styles from "./add-invoice-item-page.module.css";

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

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
  const onlyJob = invoice.jobs.length === 1 ? invoice.jobs[0] : null;

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
        <span>Add item</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">Add invoice item</h1>

          <p className={ui.intro}>
            Add an invoice-specific charge for {invoice.customerName}.
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
              Invoice items belong to one of the jobs already included on this
              draft.
            </p>
          </header>

          <div className={styles.fields}>
            <div className={styles.fullField}>
              <label htmlFor={onlyJob ? undefined : "jobId"}>Job</label>

              {onlyJob ? (
                <>
                  <div className={styles.readOnlyField}>
                    <div>
                      <Link to={`/jobs/${onlyJob.id}`}>{onlyJob.name}</Link>

                      <span>
                        Scheduled{" "}
                        {dateFormatter.format(
                          new Date(`${onlyJob.scheduledDate}T00:00:00Z`),
                        )}
                      </span>
                    </div>
                  </div>

                  <input type="hidden" name="jobId" value={onlyJob.id} />
                </>
              ) : (
                <select
                  id="jobId"
                  name="jobId"
                  required
                  defaultValue={values?.jobId ?? ""}
                  aria-invalid={!!fieldErrors?.jobId}
                  aria-describedby={
                    fieldErrors?.jobId ? "job-error" : "job-hint"
                  }
                >
                  <option value="">Choose a job</option>

                  {invoice.jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.name} —{" "}
                      {dateFormatter.format(
                        new Date(`${job.scheduledDate}T00:00:00Z`),
                      )}
                    </option>
                  ))}
                </select>
              )}

              {fieldErrors?.jobId ? (
                <p className={styles.fieldError} id="job-error" role="alert">
                  {fieldErrors.jobId}
                </p>
              ) : (
                !onlyJob && (
                  <p className={styles.fieldHint} id="job-hint">
                    Choose which invoiced job this charge relates to.
                  </p>
                )
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
                autoComplete="off"
                defaultValue={values?.description ?? ""}
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
                  placeholder="0.00"
                  required
                  autoComplete="off"
                  defaultValue={values?.amount ?? ""}
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
            {saving ? "Adding…" : "Add item"}
          </button>

          <Link className={ui.secondaryAction} to={`/invoices/${invoice.id}`}>
            Cancel
          </Link>

          <span className={styles.savingStatus} role="status">
            {saving ? "Adding invoice item…" : ""}
          </span>
        </footer>
      </Form>
    </section>
  );
}
