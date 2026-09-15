import { Form, Link, useNavigation } from "react-router";
import type {
  CreateJobInput,
  CreateJobFieldErrors,
} from "../../../../../server/features/jobs/types/create-job-input";
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
  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to="/jobs">
        ← Jobs
      </Link>
      <header className={styles.header}>
        <h1 className="page-title">New job</h1>
        <p className={styles.intro}>
          Choose a customer and schedule their work. All fields are required.
        </p>
      </header>
      {!customers.length && (
        <p className={styles.notice}>
          No active customers are available.{" "}
          <Link to="/customers/new">Create a customer</Link> or{" "}
          <Link to="/customers/archived">restore an archived customer</Link>{" "}
          before creating a job.
        </p>
      )}
      <Form method="post" className={styles.form} aria-busy={saving}>
        <div className={styles.fields}>
          <div className={styles.fullField}>
            <label htmlFor="name">Job name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={values?.name ?? ""}
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
            <label htmlFor="customerId">Customer</label>
            <select
              id="customerId"
              name="customerId"
              required
              defaultValue={values?.customerId ?? ""}
              aria-invalid={!!fieldErrors?.customerId}
              aria-describedby={
                fieldErrors?.customerId ? "customerId-error" : undefined
              }
            >
              <option value="">Select an active customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            {fieldErrors?.customerId && (
              <p
                className={styles.fieldError}
                id="customerId-error"
                role="alert"
              >
                {fieldErrors.customerId}
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
                fieldErrors?.scheduledDate ? "scheduledDate-error" : undefined
              }
            />
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
        </div>
        <div className={styles.actions}>
          <button
            className={styles.primaryAction}
            type="submit"
            disabled={saving || !customers.length}
          >
            {saving ? "Saving…" : "Create job"}
          </button>
          <Link className={styles.secondaryAction} to="/jobs">
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
