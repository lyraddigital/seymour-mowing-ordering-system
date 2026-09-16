import JobLifecycleActions from "../../components/job-lifecycle-actions/job-lifecycle-actions";
import { Link } from "react-router";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import styles from "./job-page.module.css";
import type { JobItemSummary } from "~/server/features/jobs/types/ob-item-summary";
import JobItems from "../../components/job-items/job-items";

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
  canManage: boolean;
};

export default function JobPage({
  job,
  jobItems,
  jobTotalCents,
  canManage,
}: JobPageProps) {
  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to="/jobs">
        ← Jobs
      </Link>
      <header className={styles.header}>
        <h1 className="page-title">{job.name}</h1>
        <p className={styles.intro}>Job details</p>
      </header>
      <div className={styles.detailsGrid}>
        <section className={styles.detailCard}>
          <h2>Job</h2>
          <dl className={styles.detailList}>
            <div>
              <dt>Customer</dt>
              <dd>
                <Link to={`/customers/${job.customerId}`}>
                  {job.customerName}
                </Link>
              </dd>
            </div>
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
              <dd className={styles.status}>
                {job.currentStatus === "in_progress"
                  ? "In Progress"
                  : job.currentStatus}
              </dd>
            </div>
          </dl>
        </section>
        <section className={styles.detailCard}>
          <h2>Description</h2>
          <p className={styles.description}>{job.description}</p>
        </section>
        <JobItems
          jobId={job.id}
          items={jobItems}
          totalCents={jobTotalCents}
          canManage={canManage}
        />
      </div>
      {canManage && <Link to={`/jobs/${job.id}/edit`}>Edit Job</Link>}
      {canManage && <JobLifecycleActions job={job} returnTo="detail" />}
    </section>
  );
}
