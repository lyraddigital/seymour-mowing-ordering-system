import { Link } from "react-router";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import JobList from "../../components/job-list/job-list";
import styles from "./jobs-page.module.css";

export default function JobsPage({ jobs }: { jobs: JobSummary[] }) {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className={styles.intro}>
            Scheduled work for your customers, ordered by date.
          </p>
        </div>
        <Link className={styles.primaryAction} to="/jobs/new">
          New job
        </Link>
      </header>
      <Link className={styles.historyLink} to="/jobs/history">
        Job History
      </Link>
      {jobs.length ? (
        <JobList jobs={jobs} />
      ) : (
        <div className={styles.emptyState}>
          <h2>No active jobs</h2>
          <p>
            Create a job for an active customer to start planning your work.
          </p>
          <Link className={styles.primaryAction} to="/jobs/new">
            Create job
          </Link>
        </div>
      )}
    </section>
  );
}
