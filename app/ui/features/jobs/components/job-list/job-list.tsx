import { Link } from "react-router";

import type { JobStatus } from "../../../../../server/features/jobs/job-status";
import type { JobListItem } from "../../../../../server/features/jobs/types/job-list-item";
import ui from "../../../../styles/product.module.css";
import JobLifecycleActions from "../job-lifecycle-actions/job-lifecycle-actions";
import styles from "./job-list.module.css";

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Australia/Melbourne",
});

const currencyFormat = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

interface JobListProps {
  jobs: JobListItem[];
  status: JobStatus;
  canManage?: boolean;
}

function formatStatus(status: JobStatus) {
  return status === "in_progress"
    ? "In progress"
    : `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function statusClass(status: JobStatus) {
  switch (status) {
    case "scheduled":
      return styles.scheduled;
    case "in_progress":
      return styles.inProgress;
    case "completed":
      return styles.completed;
    case "cancelled":
      return styles.cancelled;
  }
}

function ScheduledDate({ value }: { value: string }) {
  return (
    <time dateTime={value}>
      {dateFormat.format(new Date(`${value}T00:00:00+10:00`))}
    </time>
  );
}

function StatusDate({ value }: { value: number }) {
  const date = new Date(value);

  return <time dateTime={date.toISOString()}>{dateFormat.format(date)}</time>;
}

export default function JobList({
  jobs,
  status,
  canManage = false,
}: JobListProps) {
  const operational = status === "scheduled" || status === "in_progress";
  const label = `${formatStatus(status)} jobs`;

  return (
    <div
      className={ui.tableScroll}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table className={ui.table} aria-label={label}>
        <thead>
          <tr>
            <th scope="col">Job</th>
            <th scope="col">Customer</th>

            {status === "completed" ? (
              <>
                <th scope="col">Completed</th>
                <th scope="col" className={ui.numeric}>
                  Total
                </th>
                <th scope="col">Invoice</th>
              </>
            ) : (
              <>
                <th scope="col">Scheduled</th>
                {status === "cancelled" && <th scope="col">Cancelled</th>}
                {operational && <th scope="col">Status</th>}
              </>
            )}

            {canManage && operational && <th scope="col">Actions</th>}

            <th scope="col">Details</th>
          </tr>
        </thead>

        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <th scope="row" className={styles.job}>
                <Link to={`/jobs/${job.id}`}>{job.name}</Link>
              </th>

              <td className={styles.customer}>
                <Link to={`/customers/${job.customerId}`}>
                  {job.customerName}
                </Link>
              </td>

              {status === "completed" ? (
                <>
                  <td className={styles.date}>
                    <StatusDate value={job.statusChangedAt} />
                  </td>
                  <td className={ui.numeric}>
                    {currencyFormat.format(job.totalCents / 100)}
                  </td>
                  <td className={styles.invoice}>
                    {job.invoiceId ? (
                      <Link to={`/invoices/${job.invoiceId}`}>
                        {job.invoiceNumber ?? "Draft invoice"}
                      </Link>
                    ) : (
                      <span className={styles.ready}>Ready to invoice</span>
                    )}
                  </td>
                </>
              ) : (
                <>
                  <td className={styles.date}>
                    <ScheduledDate value={job.scheduledDate} />
                  </td>

                  {status === "cancelled" && (
                    <td className={styles.date}>
                      <StatusDate value={job.statusChangedAt} />
                    </td>
                  )}

                  {operational && (
                    <td>
                      <span className={statusClass(job.currentStatus)}>
                        {formatStatus(job.currentStatus)}
                      </span>
                    </td>
                  )}
                </>
              )}

              {canManage && operational && (
                <td className={styles.actions}>
                  <JobLifecycleActions
                    job={job}
                    returnTo="list"
                    display="operational"
                  />

                  <Link
                    className={styles.editAction}
                    to={`/jobs/${job.id}/edit`}
                  >
                    Edit
                  </Link>
                </td>
              )}

              <td className={ui.view}>
                <Link to={`/jobs/${job.id}`} aria-label={`View ${job.name}`}>
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
