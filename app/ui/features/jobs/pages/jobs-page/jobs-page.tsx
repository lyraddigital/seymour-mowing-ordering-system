import { Link } from "react-router";

import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import Icon from "../../../../components/icon/icon";
import ui from "../../../../styles/product.module.css";
import JobList from "../../components/job-list/job-list";

interface JobsPageProps {
  jobs: JobSummary[];
  canManage: boolean;
}

export default function JobsPage({ jobs, canManage }: JobsPageProps) {
  return (
    <section className={ui.page}>
      <header className={ui.header}>
        <div>
          <h1 className="page-title">Jobs</h1>

          <p className={ui.intro}>
            Scheduled and in-progress work for your customers, ordered by date.
          </p>
        </div>

        {canManage && (
          <Link className={ui.primaryAction} to="/jobs/new">
            <Icon name="plus" />
            New job
          </Link>
        )}
      </header>

      <nav className={ui.tabs} aria-label="Job views">
        <Link aria-current="page" to="/jobs">
          Active jobs
        </Link>

        <Link to="/jobs/history">Job history</Link>
      </nav>

      {jobs.length ? (
        <JobList jobs={jobs} canManage={canManage} />
      ) : (
        <div className={ui.emptyState}>
          <h2>No active jobs</h2>

          <p>
            Create a job for an active customer to start planning your work.
          </p>

          {canManage && (
            <Link className={ui.primaryAction} to="/jobs/new">
              <Icon name="plus" />
              Create job
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
