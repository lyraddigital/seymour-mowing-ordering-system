import { Form, Link, useNavigation } from "react-router";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import styles from "./job-page.module.css";

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function JobPage({
  job,
  canManage,
}: {
  job: JobSummary;
  canManage: boolean;
}) {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const completing = busy && navigation.formAction?.endsWith("/complete");
  const cancelling = busy && navigation.formAction?.endsWith("/cancel");
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
              <dd className={styles.status}>{job.currentStatus}</dd>
            </div>
          </dl>
        </section>
        <section className={styles.detailCard}>
          <h2>Description</h2>
          <p className={styles.description}>{job.description}</p>
        </section>
      </div>
      {canManage && job.currentStatus === "scheduled" && (
        <div className={styles.actions}>
          <Form
            method="post"
            action={`/jobs/${job.id}/complete`}
            aria-busy={busy}
          >
            <button className={styles.completeButton} disabled={busy}>
              {completing ? "Completing…" : "Complete Job"}
            </button>
          </Form>
          <details className={styles.confirmation}>
            <summary>Cancel Job</summary>
            <p>
              This job will leave the active list. Its details will be
              preserved. Cancelled jobs cannot be reopened.
            </p>
            <Form
              method="post"
              action={`/jobs/${job.id}/cancel`}
              aria-busy={busy}
              className={styles.confirmationActions}
            >
              <button className={styles.cancelJobButton} disabled={busy}>
                {cancelling ? "Cancelling…" : "Confirm cancellation"}
              </button>
              <button
                className={styles.keepButton}
                type="button"
                disabled={busy}
                onClick={(event) =>
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open")
                }
              >
                Keep scheduled
              </button>
            </Form>
          </details>
        </div>
      )}
    </section>
  );
}
