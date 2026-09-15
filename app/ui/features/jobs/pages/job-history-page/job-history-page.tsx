import { Link } from "react-router";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import JobList from "../../components/job-list/job-list";
import styles from "./job-history-page.module.css";

export default function JobHistoryPage({ jobs }: { jobs: JobSummary[] }) {
  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to="/jobs">
        ← Active Jobs
      </Link>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">Job History</h1>
          <p className={styles.intro}>
            Completed and cancelled jobs, most recent status change first.
          </p>
        </div>
      </header>
      {jobs.length ? (
        <JobList jobs={jobs} label="Job history" />
      ) : (
        <div className={styles.emptyState}>
          <h2>No completed or cancelled jobs yet</h2>
          <p>
            Jobs you complete or cancel will appear here. Their details remain
            available.
          </p>
        </div>
      )}
    </section>
  );
}
