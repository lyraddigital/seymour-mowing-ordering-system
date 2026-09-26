import { Form, Link, useNavigation } from "react-router";

import type { JobItemValidationError } from "../../../../../server/features/jobs/errors/job-item-validation-error";
import type { JobItemSummary } from "../../../../../server/features/jobs/types/job-item-summary";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import ui from "../../../../styles/product.module.css";
import styles from "./edit-job-item-page.module.css";

interface EditJobItemFormValues {
  description: string;
  amount: string;
}

interface EditJobItemPageProps {
  job: JobSummary;
  item: JobItemSummary;
  values?: EditJobItemFormValues;
  fieldErrors?: JobItemValidationError["fieldErrors"];
}

export default function EditJobItemPage({
  job,
  item,
  values,
  fieldErrors,
}: EditJobItemPageProps) {
  const saving = useNavigation().state !== "idle";

  const formValues = values ?? {
    description: item.description,
    amount: (item.amountCents / 100).toFixed(2),
  };

  return (
    <section className={`${ui.page} ${styles.page}`}>
      <div className={styles.breadcrumb}>
        <Link className={ui.breadcrumb} to="/jobs">
          Jobs
        </Link>

        <span aria-hidden="true">›</span>

        <Link className={ui.breadcrumb} to={`/jobs/${job.id}`}>
          {job.name}
        </Link>

        <span aria-hidden="true">›</span>
        <span>Edit item</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">Edit job item</h1>

          <p className={ui.intro}>Update this work item on {job.name}.</p>
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
              Changes here update the current job item and its contribution to
              the job total.
            </p>
          </header>

          <div className={styles.context}>
            <div>
              <span className={styles.contextLabel}>Job</span>
              <strong>{job.name}</strong>
            </div>

            <div>
              <span className={styles.contextLabel}>Customer</span>
              <Link to={`/customers/${job.customerId}`}>
                {job.customerName}
              </Link>
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
                  Keep the description clear enough to recognise later on an
                  invoice.
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

          <Link className={ui.secondaryAction} to={`/jobs/${job.id}`}>
            Cancel
          </Link>

          <span className={styles.savingStatus} role="status">
            {saving ? "Saving job item…" : ""}
          </span>
        </footer>
      </Form>
    </section>
  );
}
