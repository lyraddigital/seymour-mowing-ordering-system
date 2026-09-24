import { Link } from "react-router";

import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import ui from "../../../../styles/product.module.css";
import JobLifecycleActions from "../job-lifecycle-actions/job-lifecycle-actions";
import styles from "./job-list.module.css";

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

interface JobListProps {
  jobs: JobSummary[];
  label?: string;
  canManage?: boolean;
}

function formatStatus(status: JobSummary["currentStatus"]) {
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

function statusClass(status: JobSummary["currentStatus"]) {
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

export default function JobList({
  jobs,
  label = "Active jobs",
  canManage = false,
}: JobListProps) {
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
            <th scope="col">Scheduled</th>
            <th scope="col">Status</th>

            {canManage && <th scope="col">Actions</th>}

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

              <td className={styles.date}>
                <time dateTime={job.scheduledDate}>
                  {dateFormat.format(
                    new Date(`${job.scheduledDate}T00:00:00Z`),
                  )}
                </time>
              </td>

              <td>
                <span className={statusClass(job.currentStatus)}>
                  {formatStatus(job.currentStatus)}
                </span>
              </td>

              {canManage && (
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
