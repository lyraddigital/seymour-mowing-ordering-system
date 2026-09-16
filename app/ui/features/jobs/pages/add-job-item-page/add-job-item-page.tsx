import { Form, Link, useNavigation } from "react-router";

import type { JobItemValidationError } from "../../../../../server/features/jobs/errors/job-item-validation-error";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
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
    <section className={styles.page}>
      <Link className={styles.backLink} to={`/jobs/${job.id}`}>
        ← Job details
      </Link>

      <header className={styles.header}>
        <h1 className="page-title">Add job item</h1>
        <p className={styles.intro}>Add work or a charge to {job.name}.</p>
      </header>

      <Form method="post" className={styles.form} aria-busy={saving}>
        <div className={styles.fields}>
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

          <Link className={styles.secondaryAction} to={`/jobs/${job.id}`}>
            Cancel
          </Link>
        </div>
      </Form>
    </section>
  );
}
