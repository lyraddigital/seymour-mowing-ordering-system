import { Form, Link, useNavigation } from "react-router";

import styles from "./edit-invoice-page.module.css";

interface InvoiceJobOption {
  id: string;
  name: string;
  scheduledDate: string;
}

interface EditInvoicePageProps {
  invoiceId: string;
  customerName: string;
  jobs: InvoiceJobOption[];
  selectedJobIds: string[];
  errorMessage?: string;
}

export default function EditInvoicePage({
  invoiceId,
  customerName,
  jobs,
  selectedJobIds,
  errorMessage,
}: EditInvoicePageProps) {
  const navigation = useNavigation();

  const saving = navigation.state !== "idle";

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to={`/invoices/${invoiceId}`}>
        ← Invoice
      </Link>

      <header className={styles.header}>
        <h1 className="page-title">Edit draft invoice</h1>

        <p className={styles.intro}>
          Update the Jobs included on this draft invoice.
        </p>
      </header>

      <Form method="post" className={styles.form} aria-busy={saving}>
        {errorMessage && (
          <div className={styles.formError} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.customer}>
          <span>Customer</span>
          <strong>{customerName}</strong>
        </div>

        <fieldset className={styles.jobsFieldset}>
          <legend>Jobs</legend>

          <p className={styles.fieldHint}>
            Select one or more Jobs to include. Existing invoice items are
            preserved for Jobs that remain selected. Newly added Jobs snapshot
            their current Job Items.
          </p>

          <div className={styles.jobList}>
            {jobs.map((job) => (
              <label className={styles.job} key={job.id}>
                <input
                  type="checkbox"
                  name="jobId"
                  value={job.id}
                  defaultChecked={selectedJobIds.includes(job.id)}
                />

                <span className={styles.jobDetails}>
                  <strong>{job.name}</strong>

                  <span>{job.scheduledDate}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles.actions}>
          <button
            className={styles.primaryAction}
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save draft"}
          </button>

          <Link
            className={styles.secondaryAction}
            to={`/invoices/${invoiceId}`}
          >
            Cancel
          </Link>
        </div>
      </Form>
    </section>
  );
}
