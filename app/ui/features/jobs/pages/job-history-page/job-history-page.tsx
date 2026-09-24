import { Link } from "react-router";

import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import ui from "../../../../styles/product.module.css";
import JobList from "../../components/job-list/job-list";

interface JobHistoryPageProps {
  jobs: JobSummary[];
}

export default function JobHistoryPage({ jobs }: JobHistoryPageProps) {
  return (
    <section className={ui.page}>
      <header className={ui.header}>
        <div>
          <h1 className="page-title">Job history</h1>

          <p className={ui.intro}>
            Completed and cancelled jobs, most recent status change first.
          </p>
        </div>
      </header>

      <nav className={ui.tabs} aria-label="Job views">
        <Link to="/jobs">Active jobs</Link>

        <Link aria-current="page" to="/jobs/history">
          Job history
        </Link>
      </nav>

      {jobs.length ? (
        <JobList jobs={jobs} label="Job history" />
      ) : (
        <div className={ui.emptyState}>
          <h2>No completed or cancelled jobs yet</h2>

          <p>
            Jobs you complete or cancel will appear here. Their details remain
            available.
          </p>

          <Link className={ui.secondaryAction} to="/jobs">
            View active jobs
          </Link>
        </div>
      )}
    </section>
  );
}
