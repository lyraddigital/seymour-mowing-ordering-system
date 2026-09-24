import { Form, Link, useNavigation } from "react-router";

import type {
  CreateJobFieldErrors,
  CreateJobInput,
} from "../../../../../server/features/jobs/types/create-job-input";
import Icon from "../../../../components/icon/icon";
import ui from "../../../../styles/product.module.css";
import styles from "./new-job-page.module.css";

interface NewJobPageProps {
  customers: { id: string; name: string }[];
  values?: CreateJobInput;
  fieldErrors?: CreateJobFieldErrors;
}

export default function NewJobPage({
  customers,
  values,
  fieldErrors,
}: NewJobPageProps) {
  const saving = useNavigation().state !== "idle";
  const hasCustomers = customers.length > 0;

  return (
    <section className={`${ui.page} ${styles.page}`}>
      <div className={styles.breadcrumb}>
        <Link className={ui.breadcrumb} to="/jobs">
          Jobs
        </Link>

        <span aria-hidden="true">›</span>
        <span>New job</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">New job</h1>

          <p className={ui.intro}>
            Choose a customer, schedule the work and describe what needs to be
            done.
          </p>
        </div>
      </header>

      {!hasCustomers && (
        <div className={styles.notice} role="status">
          <span className={ui.iconCircle}>
            <Icon name="customers" />
          </span>

          <div>
            <h2>No active customers</h2>

            <p>
              You need an active customer before you can create a job.{" "}
              <Link to="/customers/new">Create a customer</Link> or{" "}
              <Link to="/customers/archived">restore an archived customer</Link>
              .
            </p>
          </div>
        </div>
      )}

      <Form method="post" className={styles.form} aria-busy={saving}>
        <section
          className={styles.formSection}
          aria-labelledby="job-details-heading"
        >
          <header className={styles.sectionHeader}>
            <h2 id="job-details-heading">Job details</h2>

            <p>All fields are required.</p>
          </header>

          <div className={styles.fields}>
            <div className={styles.fullField}>
              <label htmlFor="name">Job name</label>

              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={200}
                autoComplete="off"
                defaultValue={values?.name ?? ""}
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

            <div>
              <label htmlFor="customerId">Customer</label>

              <select
                id="customerId"
                name="customerId"
                required
                disabled={!hasCustomers}
                defaultValue={values?.customerId ?? ""}
                aria-invalid={!!fieldErrors?.customerId}
                aria-describedby={
                  fieldErrors?.customerId
                    ? "customerId-error"
                    : "customerId-hint"
                }
              >
                <option value="">Select a customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>

              {fieldErrors?.customerId ? (
                <p
                  className={styles.fieldError}
                  id="customerId-error"
                  role="alert"
                >
                  {fieldErrors.customerId}
                </p>
              ) : (
                <p className={styles.fieldHint} id="customerId-hint">
                  The customer cannot be changed after the job is created.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="scheduledDate">Scheduled date</label>

              <input
                id="scheduledDate"
                name="scheduledDate"
                type="date"
                min="0001-01-01"
                max="9999-12-31"
                required
                defaultValue={values?.scheduledDate ?? ""}
                aria-invalid={!!fieldErrors?.scheduledDate}
                aria-describedby={
                  fieldErrors?.scheduledDate
                    ? "scheduledDate-error"
                    : "scheduledDate-hint"
                }
              />

              {fieldErrors?.scheduledDate ? (
                <p
                  className={styles.fieldError}
                  id="scheduledDate-error"
                  role="alert"
                >
                  {fieldErrors.scheduledDate}
                </p>
              ) : (
                <p className={styles.fieldHint} id="scheduledDate-hint">
                  This can be changed while the job is still scheduled.
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
                  Include enough detail to understand the work when the job is
                  opened later.
                </p>
              )}
            </div>
          </div>
        </section>

        <footer className={styles.actions}>
          <button
            className={ui.primaryAction}
            type="submit"
            disabled={saving || !hasCustomers}
          >
            {saving ? "Creating…" : "Create job"}
          </button>

          <Link className={ui.secondaryAction} to="/jobs">
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
