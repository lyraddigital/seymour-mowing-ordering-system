import { Link } from "react-router";

import type { JobStatus } from "../../../../../server/features/jobs/job-status";
import type { JobListItem } from "../../../../../server/features/jobs/types/job-list-item";
import Icon from "../../../../components/icon/icon";
import ui from "../../../../styles/product.module.css";
import JobList from "../../components/job-list/job-list";

interface JobsPageProps {
  jobs: JobListItem[];
  status: JobStatus;
  canManage: boolean;
}

const views: { status: JobStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "in_progress", label: "In progress" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
];

const viewCopy: Record<
  JobStatus,
  { intro: string; emptyTitle: string; emptyText: string }
> = {
  scheduled: {
    intro: "Upcoming work for your customers, ordered by scheduled date.",
    emptyTitle: "No scheduled jobs",
    emptyText:
      "Create a job for an active customer to start planning your work.",
  },
  in_progress: {
    intro: "Work that has started and is ready to be completed.",
    emptyTitle: "No jobs in progress",
    emptyText: "Jobs will appear here after they are started.",
  },
  completed: {
    intro: "Completed work and its current invoice allocation.",
    emptyTitle: "No completed jobs",
    emptyText: "Jobs will appear here after they are completed.",
  },
  cancelled: {
    intro: "Cancelled work, ordered by the most recent cancellation.",
    emptyTitle: "No cancelled jobs",
    emptyText: "Cancelled jobs will remain available here.",
  },
};

export default function JobsPage({ jobs, status, canManage }: JobsPageProps) {
  const copy = viewCopy[status];

  return (
    <section className={ui.page}>
      <header className={ui.header}>
        <div>
          <h1 className="page-title">Jobs</h1>

          <p className={ui.intro}>{copy.intro}</p>
        </div>

        {canManage && (
          <Link className={ui.primaryAction} to="/jobs/new">
            <Icon name="plus" />
            New job
          </Link>
        )}
      </header>

      <nav className={ui.tabs} aria-label="Job status views">
        {views.map((view) => (
          <Link
            key={view.status}
            aria-current={view.status === status ? "page" : undefined}
            to={`/jobs?status=${view.status}`}
          >
            {view.label}
          </Link>
        ))}
      </nav>

      {jobs.length ? (
        <JobList jobs={jobs} status={status} canManage={canManage} />
      ) : (
        <div className={ui.emptyState}>
          <h2>{copy.emptyTitle}</h2>

          <p>{copy.emptyText}</p>

          {canManage && status === "scheduled" && (
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
