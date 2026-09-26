import { Form, Link, useNavigation } from "react-router";

import type { JobItemValidationError } from "../../../../../server/features/jobs/errors/job-item-validation-error";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import ui from "../../../../styles/product.module.css";
import styles from "./add-job-item-page.module.css";

interface AddJobItemFormValues {
  description: string;
  amount: string;
}

interface AddJobItemPageProps {
  job: JobSummary;
  values?: AddJobItemFormValues;
  fieldErrors?: JobItemValidationError["fieldErrors"];
}

export default function AddJobItemPage({
  job,
  values,
  fieldErrors,
}: AddJobItemPageProps) {
  const saving = useNavigation().state !== "idle";

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
        <span>Add item</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">Add job item</h1>

          <p className={ui.intro}>Add work or a charge to {job.name}.</p>
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
              Describe the work and enter the amount that should contribute to
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
                  Use a short description that will still make sense when this
                  work is invoiced later.
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

          <Link className={ui.secondaryAction} to={`/jobs/${job.id}`}>
            Cancel
          </Link>

          <span className={styles.savingStatus} role="status">
            {saving ? "Adding job item…" : ""}
          </span>
        </footer>
      </Form>
    </section>
  );
}
