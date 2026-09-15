import { Form, useNavigation } from "react-router";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import styles from "./job-lifecycle-actions.module.css";

interface JobLifecycleActionsProps {
  job: Pick<JobSummary, "id" | "name" | "currentStatus">;
  returnTo: "list" | "detail";
}

export default function JobLifecycleActions({ job, returnTo }: JobLifecycleActionsProps) {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  if (job.currentStatus !== "scheduled" && job.currentStatus !== "in_progress") return null;
  const actionPath = `/jobs/${job.id}`;
  return <div className={styles.actions} role="group" aria-label={`Actions for ${job.name}`}>
    <div className={styles.operationalActions}>
      {job.currentStatus === "scheduled" && <Form method="post" action={`${actionPath}/start`} aria-busy={busy}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <button className={styles.completeButton} disabled={busy}>{busy && navigation.formAction === `${actionPath}/start` ? "Starting…" : "Start Job"}</button>
      </Form>}
      <Form method="post" action={`${actionPath}/complete`} aria-busy={busy}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <button className={styles.completeButton} disabled={busy}>{busy && navigation.formAction === `${actionPath}/complete` ? "Completing…" : "Complete Job"}</button>
      </Form>
    </div>
    <details className={styles.confirmation}>
      <summary>Cancel Job</summary>
      <p>This job will leave the active list. Its details will be preserved. Cancelled jobs cannot be reopened.</p>
      <Form method="post" action={`${actionPath}/cancel`} aria-busy={busy} className={styles.confirmationActions}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <button className={styles.cancelJobButton} disabled={busy}>{busy && navigation.formAction === `${actionPath}/cancel` ? "Cancelling…" : "Confirm cancellation"}</button>
        <button className={styles.keepButton} type="button" disabled={busy}
          onClick={event => event.currentTarget.closest("details")?.removeAttribute("open")}>Keep job</button>
      </Form>
    </details>
  </div>;
}
