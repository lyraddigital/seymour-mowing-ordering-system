import { Form, Link, useNavigation } from "react-router";

import type { CreateJobFieldErrors } from "../../../../../server/features/jobs/types/create-job-input";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import type { UpdateJobInput } from "../../../../../server/features/jobs/types/update-job-input";
import styles from "./edit-job-page.module.css";

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function EditJobPage({
  job,
  values,
  fieldErrors,
}: {
  job: JobSummary;
  values?: UpdateJobInput;
  fieldErrors?: CreateJobFieldErrors;
}) {
  const saving = useNavigation().state !== "idle";
  const scheduled = job.currentStatus === "scheduled";

  const formValues = values ?? {
    name: job.name,
    description: job.description,
    scheduledDate: job.scheduledDate,
  };

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to={`/jobs/${job.id}`}>
        ← Job details
      </Link>

      <header className={styles.header}>
        <h1 className="page-title">Edit job</h1>
        <p className={styles.intro}>
          Update the job details. The customer cannot be changed.
        </p>
      </header>

      <Form method="post" className={styles.form} aria-busy={saving}>
        <div className={styles.fields}>
          <div>
            <span className={styles.label}>Customer</span>
            <p className={styles.readOnlyValue}>
              <Link to={`/customers/${job.customerId}`}>
                {job.customerName}
              </Link>
            </p>
          </div>

          <div className={styles.fullField}>
            <label htmlFor="name">Job name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={formValues.name}
              aria-invalid={!!fieldErrors?.name}
              aria-describedby={fieldErrors?.name ? "name-error" : undefined}
            />

            {fieldErrors?.name && (
              <p className={styles.fieldError} id="name-error" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="scheduledDate">Scheduled date</label>

            {scheduled ? (
              <input
                id="scheduledDate"
                name="scheduledDate"
                type="date"
                min="0001-01-01"
                max="9999-12-31"
                required
                defaultValue={formValues.scheduledDate}
                aria-invalid={!!fieldErrors?.scheduledDate}
                aria-describedby={
                  fieldErrors?.scheduledDate ? "scheduledDate-error" : undefined
                }
              />
            ) : (
              <>
                <p className={styles.readOnlyValue}>
                  {dateFormat.format(
                    new Date(`${job.scheduledDate}T00:00:00Z`),
                  )}
                </p>

                <input
                  type="hidden"
                  name="scheduledDate"
                  value={job.scheduledDate}
                />

                <p className={styles.fieldHint}>
                  The scheduled date cannot be changed after work has started.
                </p>
              </>
            )}

            {fieldErrors?.scheduledDate && (
              <p
                className={styles.fieldError}
                id="scheduledDate-error"
                role="alert"
              >
                {fieldErrors.scheduledDate}
              </p>
            )}
          </div>

          <div className={styles.fullField}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
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
        </div>

        <div className={styles.actions}>
          <button
            className={styles.primaryAction}
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>

          <Link className={styles.secondaryAction} to={`/jobs/${job.id}`}>
            Cancel
          </Link>

          <span className={styles.savingStatus} role="status">
            {saving ? "Saving job details…" : ""}
          </span>
        </div>
      </Form>
    </section>
  );
}
