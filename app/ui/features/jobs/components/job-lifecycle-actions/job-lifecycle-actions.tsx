import { Form, useNavigation } from "react-router";

import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import styles from "./job-lifecycle-actions.module.css";

interface JobLifecycleActionsProps {
  job: Pick<JobSummary, "id" | "name" | "currentStatus">;
  returnTo: "list" | "detail";
  display?: "all" | "operational" | "danger";
}

export default function JobLifecycleActions({
  job,
  returnTo,
  display = "all",
}: JobLifecycleActionsProps) {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  if (
    job.currentStatus !== "scheduled" &&
    job.currentStatus !== "in_progress"
  ) {
    return null;
  }

  const actionPath = `/jobs/${job.id}`;
  const showOperational = display !== "danger";
  const showDanger = display !== "operational";

  const className = [
    styles.actions,
    display === "operational" ? styles.operationalOnly : "",
    display === "danger" ? styles.dangerOnly : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      role="group"
      aria-label={`Actions for ${job.name}`}
    >
      {showOperational && (
        <div className={styles.operationalActions}>
          {job.currentStatus === "scheduled" && (
            <Form method="post" action={`${actionPath}/start`} aria-busy={busy}>
              <input type="hidden" name="returnTo" value={returnTo} />

              <button
                className={styles.primaryButton}
                type="submit"
                disabled={busy}
              >
                {busy && navigation.formAction === `${actionPath}/start`
                  ? "Starting…"
                  : "Start Job"}
              </button>
            </Form>
          )}

          <Form
            method="post"
            action={`${actionPath}/complete`}
            aria-busy={busy}
          >
            <input type="hidden" name="returnTo" value={returnTo} />

            <button
              className={
                job.currentStatus === "in_progress"
                  ? styles.primaryButton
                  : styles.secondaryButton
              }
              type="submit"
              disabled={busy}
            >
              {busy && navigation.formAction === `${actionPath}/complete`
                ? "Completing…"
                : "Complete Job"}
            </button>
          </Form>
        </div>
      )}

      {showDanger && (
        <details className={styles.confirmation}>
          <summary>Cancel Job</summary>

          <p>
            This job will leave the active list. Its details will be preserved.
            Cancelled jobs cannot be reopened.
          </p>

          <Form
            method="post"
            action={`${actionPath}/cancel`}
            aria-busy={busy}
            className={styles.confirmationActions}
          >
            <input type="hidden" name="returnTo" value={returnTo} />

            <button
              className={styles.cancelJobButton}
              type="submit"
              disabled={busy}
            >
              {busy && navigation.formAction === `${actionPath}/cancel`
                ? "Cancelling…"
                : "Confirm cancellation"}
            </button>

            <button
              className={styles.keepButton}
              type="button"
              disabled={busy}
              onClick={(event) =>
                event.currentTarget.closest("details")?.removeAttribute("open")
              }
            >
              Keep job
            </button>
          </Form>
        </details>
      )}
    </div>
  );
}
