import { Link } from "react-router";

import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import type { JobItemSummary } from "../../../../../server/features/jobs/types/job-item-summary";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import Icon from "../../../../components/icon/icon";
import ui from "../../../../styles/product.module.css";
import JobItems from "../../components/job-items/job-items";
import JobLifecycleActions from "../../components/job-lifecycle-actions/job-lifecycle-actions";
import styles from "./job-page.module.css";

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

type JobPageProps = {
  job: JobSummary;
  jobItems: JobItemSummary[];
  jobTotalCents: number;
  invoice: Pick<InvoiceSummary, "id" | "invoiceNumber" | "status"> | null;
  canManage: boolean;
  canCreateInvoice: boolean;
};

function formatJobStatus(status: JobSummary["currentStatus"]) {
  switch (status) {
    case "scheduled":
      return "Scheduled";

    case "in_progress":
      return "In progress";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";
  }
}

function formatInvoiceStatus(status: InvoiceSummary["status"]) {
  switch (status) {
    case "draft":
      return "Draft";

    case "issued":
      return "Issued";

    case "voided":
      return "Voided";
  }
}

export default function JobPage({
  job,
  jobItems,
  jobTotalCents,
  invoice,
  canManage,
  canCreateInvoice,
}: JobPageProps) {
  const active =
    job.currentStatus === "scheduled" || job.currentStatus === "in_progress";

  return (
    <section className={ui.page}>
      <div className={styles.breadcrumb}>
        <Link className={ui.breadcrumb} to="/jobs">
          Jobs
        </Link>

        <span aria-hidden="true">›</span>
        <span>{job.name}</span>
      </div>

      <header className={ui.header}>
        <div>
          <div className={styles.title}>
            <h1 className="page-title">{job.name}</h1>

            <span className={`${styles.status} ${styles[job.currentStatus]}`}>
              {formatJobStatus(job.currentStatus)}
            </span>
          </div>

          <p className={styles.context}>
            <Link to={`/customers/${job.customerId}`}>{job.customerName}</Link>

            <span aria-hidden="true">·</span>

            <span>
              Scheduled{" "}
              <time dateTime={job.scheduledDate}>
                {dateFormat.format(new Date(`${job.scheduledDate}T00:00:00Z`))}
              </time>
            </span>
          </p>
        </div>

        {canManage && (
          <div className={styles.headerActions}>
            {active && (
              <JobLifecycleActions
                job={job}
                returnTo="detail"
                display="operational"
              />
            )}

            <Link className={ui.secondaryAction} to={`/jobs/${job.id}/edit`}>
              <Icon name="edit" />
              Edit job
            </Link>
          </div>
        )}
      </header>

      <section
        className={styles.description}
        aria-labelledby="job-description-heading"
      >
        <span className={styles.sectionIcon}>
          <Icon name="notes" />
        </span>

        <div>
          <h2 id="job-description-heading">Description</h2>

          <p>{job.description || "No description added."}</p>
        </div>
      </section>

      <JobItems
        jobId={job.id}
        items={jobItems}
        totalCents={jobTotalCents}
        canManage={canManage}
      />

      <section className={styles.invoice} aria-labelledby="job-invoice-heading">
        <span className={styles.sectionIcon}>
          <Icon name="invoice" />
        </span>

        <div className={styles.invoiceContent}>
          <h2 id="job-invoice-heading">Invoice</h2>

          {invoice ? (
            <div className={styles.invoiceRelationship}>
              <div>
                <div className={styles.invoiceTitle}>
                  <Link to={`/invoices/${invoice.id}`}>
                    {invoice.invoiceNumber ?? "Draft invoice"}
                  </Link>

                  <span className={ui[invoice.status]}>
                    {formatInvoiceStatus(invoice.status)}
                  </span>
                </div>

                <p>This job is currently assigned to this invoice.</p>
              </div>

              <Link
                className={ui.secondaryAction}
                to={`/invoices/${invoice.id}`}
              >
                View invoice
              </Link>
            </div>
          ) : (
            <div className={styles.invoiceRelationship}>
              <div>
                <p className={styles.noInvoice}>
                  This job has not been added to an invoice yet.
                </p>
              </div>

              {canCreateInvoice && (
                <Link
                  className={ui.primaryAction}
                  to={`/invoices/new?jobId=${job.id}`}
                >
                  <Icon name="plus" />
                  Create invoice
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {canManage && active && (
        <section className={styles.danger} aria-labelledby="job-danger-heading">
          <span className={styles.dangerIcon}>
            <Icon name="danger" />
          </span>

          <div className={styles.dangerCopy}>
            <h2 id="job-danger-heading">Danger zone</h2>

            <p>
              Cancel this job if the work will no longer be carried out. Its
              details and history will be preserved.
            </p>
          </div>

          <JobLifecycleActions job={job} returnTo="detail" display="danger" />
        </section>
      )}
    </section>
  );
}
