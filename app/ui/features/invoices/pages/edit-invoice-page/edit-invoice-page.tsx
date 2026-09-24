import { Form, Link, useNavigation } from "react-router";

import ui from "../../../../styles/product.module.css";
import styles from "./edit-invoice-page.module.css";

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

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
  const saving = useNavigation().state !== "idle";

  return (
    <section className={`${ui.page} ${styles.page}`}>
      <div className={styles.breadcrumb}>
        <Link className={ui.breadcrumb} to="/invoices">
          Invoices
        </Link>

        <span aria-hidden="true">›</span>

        <Link className={ui.breadcrumb} to={`/invoices/${invoiceId}`}>
          Draft invoice
        </Link>

        <span aria-hidden="true">›</span>
        <span>Edit</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">Edit draft invoice</h1>

          <p className={ui.intro}>
            Update the jobs included on this draft invoice.
          </p>
        </div>
      </header>

      <Form method="post" className={styles.form} aria-busy={saving}>
        {errorMessage && (
          <div className={styles.formError} role="alert">
            <strong>Draft could not be updated.</strong>
            <span>{errorMessage}</span>
          </div>
        )}

        <section
          className={styles.formSection}
          aria-labelledby="invoice-customer-heading"
        >
          <header className={styles.sectionHeader}>
            <h2 id="invoice-customer-heading">Customer</h2>

            <p>The customer cannot be changed after the draft is created.</p>
          </header>

          <div className={styles.readOnlyField}>{customerName}</div>
        </section>

        <section
          className={styles.formSection}
          aria-labelledby="invoice-jobs-heading"
        >
          <header className={styles.sectionHeader}>
            <div>
              <h2 id="invoice-jobs-heading">Jobs</h2>

              <p>
                Existing invoice items are preserved for jobs that remain
                selected. Newly added jobs snapshot their current job items.
              </p>
            </div>

            <div className={styles.selectionSummary}>
              <strong>{selectedJobIds.length}</strong>
              <span>
                {selectedJobIds.length === 1 ? "job selected" : "jobs selected"}
              </span>
            </div>
          </header>

          <fieldset className={styles.jobsFieldset}>
            <legend className={styles.visuallyHidden}>Jobs to include</legend>

            <div className={styles.jobList}>
              {jobs.map((job) => {
                const selected = selectedJobIds.includes(job.id);

                return (
                  <label
                    className={`${styles.job} ${
                      selected ? styles.selectedJob : ""
                    }`}
                    key={job.id}
                  >
                    <input
                      type="checkbox"
                      name="jobId"
                      value={job.id}
                      defaultChecked={selected}
                    />

                    <span className={styles.jobDetails}>
                      <strong>{job.name}</strong>

                      <span>
                        Scheduled{" "}
                        {dateFormatter.format(
                          new Date(`${job.scheduledDate}T00:00:00Z`),
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <footer className={styles.actions}>
          <button className={ui.primaryAction} type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </button>

          <Link className={ui.secondaryAction} to={`/invoices/${invoiceId}`}>
            Cancel
          </Link>

          <span className={styles.savingStatus} role="status">
            {saving ? "Saving draft invoice…" : ""}
          </span>
        </footer>
      </Form>
    </section>
  );
}
