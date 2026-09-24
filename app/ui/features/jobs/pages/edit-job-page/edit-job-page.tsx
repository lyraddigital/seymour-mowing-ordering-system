import { Form, Link, useNavigation } from "react-router";

import type { CreateJobFieldErrors } from "../../../../../server/features/jobs/types/create-job-input";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import type { UpdateJobInput } from "../../../../../server/features/jobs/types/update-job-input";
import ui from "../../../../styles/product.module.css";
import styles from "./edit-job-page.module.css";

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

interface EditJobPageProps {
  job: JobSummary;
  values?: UpdateJobInput;
  fieldErrors?: CreateJobFieldErrors;
}

export default function EditJobPage({
  job,
  values,
  fieldErrors,
}: EditJobPageProps) {
  const saving = useNavigation().state !== "idle";
  const scheduled = job.currentStatus === "scheduled";

  const formValues = values ?? {
    name: job.name,
    description: job.description,
    scheduledDate: job.scheduledDate,
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
        <span>Edit</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">Edit job</h1>

          <p className={ui.intro}>
            Update the work details for {job.customerName}.
          </p>
        </div>
      </header>

      <Form method="post" className={styles.form} aria-busy={saving}>
        <section
          className={styles.formSection}
          aria-labelledby="job-details-heading"
        >
          <header className={styles.sectionHeader}>
            <h2 id="job-details-heading">Job details</h2>

            <p>Customer assignment cannot be changed after a job is created.</p>
          </header>

          <div className={styles.fields}>
            <div>
              <span className={styles.label}>Customer</span>

              <div className={styles.readOnlyField}>
                <Link to={`/customers/${job.customerId}`}>
                  {job.customerName}
                </Link>
              </div>

              <p className={styles.fieldHint}>
                To move work to another customer, create a new job instead.
              </p>
            </div>

            <div>
              <label htmlFor="scheduledDate">Scheduled date</label>

              {scheduled ? (
                <>
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
                      fieldErrors?.scheduledDate
                        ? "scheduledDate-error"
                        : "scheduledDate-hint"
                    }
                  />

                  {!fieldErrors?.scheduledDate && (
                    <p className={styles.fieldHint} id="scheduledDate-hint">
                      The date can be changed until work starts.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.readOnlyField}>
                    {dateFormat.format(
                      new Date(`${job.scheduledDate}T00:00:00Z`),
                    )}
                  </div>

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
              <label htmlFor="name">Job name</label>

              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={200}
                defaultValue={formValues.name}
                aria-invalid={!!fieldErrors?.name}
                aria-describedby={
                  fieldErrors?.name ? "name-error" : "name-hint"
                }
              />

              {fieldErrors?.name ? (
                <p className={styles.fieldError} id="name-error" role="alert">
                  {fieldErrors.name}
                </p>
              ) : (
                <p className={styles.fieldHint} id="name-hint">
                  Use a short name that makes the work easy to recognise.
                </p>
              )}
            </div>

            <div className={styles.fullField}>
              <label htmlFor="description">Description</label>

              <textarea
                id="description"
                name="description"
                rows={5}
                maxLength={2000}
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
                  Keep the work instructions accurate for whoever opens this job
                  later.
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
            {saving ? "Saving job details…" : ""}
          </span>
        </footer>
      </Form>
    </section>
  );
}
