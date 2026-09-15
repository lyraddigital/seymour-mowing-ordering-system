import { Link } from "react-router";
import JobLifecycleActions from "../job-lifecycle-actions/job-lifecycle-actions";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import styles from "./job-list.module.css";

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default function JobList({
  jobs,
  label = "Active jobs",
  canManage = false,
}: {
  jobs: JobSummary[];
  label?: string;
  canManage?: boolean;
}) {
  return (
    <ul className={styles.list} aria-label={label}>
      {jobs.map((job) => (
        <li key={job.id} className={styles.job}>
          <div>
            <h2 className={styles.jobName}>
              <Link to={`/jobs/${job.id}`}>{job.name}</Link>
            </h2>
            <p className={styles.customerName}>
              <Link to={`/customers/${job.customerId}`}>
                {job.customerName}
              </Link>
            </p>
            <p className={styles.description}>{job.description}</p>
          </div>
          <dl className={styles.details}>
            <div>
              <dt>Scheduled date</dt>
              <dd>
                <time dateTime={job.scheduledDate}>
                  {dateFormat.format(
                    new Date(`${job.scheduledDate}T00:00:00Z`),
                  )}
                </time>
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className={styles.status}>{job.currentStatus === "in_progress" ? "In Progress" : job.currentStatus}</dd>
            </div>
          </dl>
          {canManage && <div className={styles.lifecycleActions}><JobLifecycleActions job={job} returnTo="list" /></div>}
        </li>
      ))}
    </ul>
  );
}
