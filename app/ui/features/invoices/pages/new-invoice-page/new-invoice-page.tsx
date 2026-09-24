import { useMemo, useState } from "react";
import { Form, Link, useNavigation } from "react-router";

import type { InvoiceableJobSummary } from "../../../../../server/features/invoices/types/invoiceable-job-summary";
import ui from "../../../../styles/product.module.css";
import styles from "./new-invoice-page.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

interface NewInvoicePageProps {
  jobs: InvoiceableJobSummary[];
  initialJobId: string | null;
  values?: {
    jobIds: string[];
  };
  errorMessage?: string;
}

export default function NewInvoicePage({
  jobs,
  initialJobId,
  values,
  errorMessage,
}: NewInvoicePageProps) {
  const saving = useNavigation().state !== "idle";

  const initialJobIds = values?.jobIds ?? (initialJobId ? [initialJobId] : []);

  const initialCustomerId =
    jobs.find((job) => initialJobIds.includes(job.id))?.customerId ?? "";

  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>(initialJobIds);

  const customers = useMemo(() => {
    const customersById = new Map<
      string,
      {
        id: string;
        name: string;
      }
    >();

    for (const job of jobs) {
      customersById.set(job.customerId, {
        id: job.customerId,
        name: job.customerName,
      });
    }

    return [...customersById.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [jobs]);

  const customerJobs = jobs.filter((job) => job.customerId === customerId);

  const selectedJobs = customerJobs.filter((job) =>
    selectedJobIds.includes(job.id),
  );

  const selectedTotalCents = selectedJobs.reduce(
    (total, job) => total + job.totalCents,
    0,
  );

  function changeCustomer(nextCustomerId: string) {
    setCustomerId(nextCustomerId);
    setSelectedJobIds([]);
  }

  function toggleJob(jobId: string) {
    setSelectedJobIds((current) =>
      current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId],
    );
  }

  return (
    <section className={`${ui.page} ${styles.page}`}>
      <div className={styles.breadcrumb}>
        <Link className={ui.breadcrumb} to="/invoices">
          Invoices
        </Link>

        <span aria-hidden="true">›</span>
        <span>Create invoice</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">Create invoice</h1>

          <p className={ui.intro}>
            Choose a customer and select the jobs to include on the draft
            invoice.
          </p>
        </div>
      </header>

      {jobs.length === 0 ? (
        <div className={ui.emptyState}>
          <h2>No jobs available to invoice</h2>

          <p>
            Jobs already assigned to a draft or issued invoice are not available
            here.
          </p>

          <Link className={ui.secondaryAction} to="/jobs">
            View jobs
          </Link>
        </div>
      ) : (
        <Form method="post" className={styles.form} aria-busy={saving}>
          {errorMessage && (
            <div className={styles.formError} role="alert">
              <strong>Invoice could not be created.</strong>
              <span>{errorMessage}</span>
            </div>
          )}

          <section
            className={styles.formSection}
            aria-labelledby="invoice-customer-heading"
          >
            <header className={styles.sectionHeader}>
              <h2 id="invoice-customer-heading">Customer</h2>

              <p>All jobs on an invoice must belong to the same customer.</p>
            </header>

            <div className={styles.customerField}>
              <label htmlFor="customerId">Customer</label>

              <select
                id="customerId"
                value={customerId}
                onChange={(event) => changeCustomer(event.target.value)}
              >
                <option value="">Select a customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>

              <p className={styles.fieldHint}>
                The customer is determined by the jobs added to the draft.
              </p>
            </div>
          </section>

          <section
            className={styles.formSection}
            aria-labelledby="invoice-jobs-heading"
          >
            <header className={styles.sectionHeader}>
              <div>
                <h2 id="invoice-jobs-heading">Jobs</h2>

                <p>Select one or more jobs to include on this invoice.</p>
              </div>

              {customerId && (
                <div className={styles.selectionSummary}>
                  <strong>{selectedJobIds.length}</strong>
                  <span>
                    {selectedJobIds.length === 1
                      ? "job selected"
                      : "jobs selected"}
                  </span>
                </div>
              )}
            </header>

            {!customerId ? (
              <div className={styles.placeholder}>
                Select a customer to see available jobs.
              </div>
            ) : customerJobs.length === 0 ? (
              <div className={styles.placeholder}>
                This customer has no jobs available to invoice.
              </div>
            ) : (
              <fieldset className={styles.jobsFieldset}>
                <legend className={styles.visuallyHidden}>
                  Jobs to include
                </legend>

                <div className={styles.jobList}>
                  {customerJobs.map((job) => {
                    const checked = selectedJobIds.includes(job.id);

                    return (
                      <label
                        className={`${styles.job} ${
                          checked ? styles.selectedJob : ""
                        }`}
                        key={job.id}
                      >
                        <input
                          type="checkbox"
                          name="jobId"
                          value={job.id}
                          checked={checked}
                          onChange={() => toggleJob(job.id)}
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

                        <span className={styles.jobTotal}>
                          {currencyFormatter.format(job.totalCents / 100)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {selectedJobIds.length > 0 && (
              <div className={styles.total}>
                <span>Selected jobs total</span>

                <strong>
                  {currencyFormatter.format(selectedTotalCents / 100)}
                </strong>
              </div>
            )}
          </section>

          <footer className={styles.actions}>
            <button
              className={ui.primaryAction}
              type="submit"
              disabled={saving || selectedJobIds.length === 0}
            >
              {saving ? "Creating…" : "Create draft invoice"}
            </button>

            <Link className={ui.secondaryAction} to="/invoices">
              Cancel
            </Link>

            <span className={styles.savingStatus} role="status">
              {saving ? "Creating draft invoice…" : ""}
            </span>
          </footer>
        </Form>
      )}
    </section>
  );
}
