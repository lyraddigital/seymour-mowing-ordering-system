import { useMemo, useState } from "react";
import { Form, Link, useNavigation } from "react-router";

import type { InvoiceableJobSummary } from "../../../../../server/features/invoices/types/invoiceable-job-summary";
import styles from "./new-invoice-page.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
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
  const navigation = useNavigation();
  const saving = navigation.state !== "idle";

  const initialJobIds = values?.jobIds ?? (initialJobId ? [initialJobId] : []);

  const initialCustomerId =
    jobs.find((job) => initialJobIds.includes(job.id))?.customerId ?? "";

  const [customerId, setCustomerId] = useState(initialCustomerId);

  const [selectedJobIds, setSelectedJobIds] = useState<string[]>(initialJobIds);

  const customers = useMemo(() => {
    const customersById = new Map<string, { id: string; name: string }>();

    for (const job of jobs) {
      customersById.set(job.customerId, {
        id: job.customerId,
        name: job.customerName,
      });
    }

    return [...customersById.values()];
  }, [jobs]);

  const customerJobs = jobs.filter((job) => job.customerId === customerId);

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
    <section className={styles.page}>
      <Link className={styles.backLink} to="/invoices">
        ← Invoices
      </Link>

      <header className={styles.header}>
        <h1 className="page-title">Create invoice</h1>

        <p className={styles.intro}>
          Choose a customer and select the jobs to include on the draft invoice.
        </p>
      </header>

      {jobs.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No jobs available to invoice</h2>
          <p>
            Jobs already attached to a draft or issued invoice are not available
            here.
          </p>
        </div>
      ) : (
        <Form method="post" className={styles.form} aria-busy={saving}>
          {errorMessage && (
            <div className={styles.formError} role="alert">
              {errorMessage}
            </div>
          )}

          <div className={styles.field}>
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
          </div>

          {customerId && (
            <fieldset className={styles.jobsFieldset}>
              <legend>Jobs</legend>

              <p className={styles.fieldHint}>
                Select one or more jobs for this invoice.
              </p>

              <div className={styles.jobList}>
                {customerJobs.map((job) => {
                  const checked = selectedJobIds.includes(job.id);

                  return (
                    <label className={styles.job} key={job.id}>
                      <input
                        type="checkbox"
                        name="jobId"
                        value={job.id}
                        checked={checked}
                        onChange={() => toggleJob(job.id)}
                      />

                      <span className={styles.jobDetails}>
                        <strong>{job.name}</strong>

                        <span>{job.scheduledDate}</span>
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

          <div className={styles.actions}>
            <button
              className={styles.primaryAction}
              type="submit"
              disabled={saving || selectedJobIds.length === 0}
            >
              {saving ? "Creating…" : "Create draft invoice"}
            </button>

            <Link className={styles.secondaryAction} to="/invoices">
              Cancel
            </Link>
          </div>
        </Form>
      )}
    </section>
  );
}
