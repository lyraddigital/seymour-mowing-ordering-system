import { Form, useNavigation } from "react-router";
import styles from "./customer-archive-actions.module.css";

type CustomerArchiveActionsProps = {
  customerId: string;
  archived: boolean;
};

export default function CustomerArchiveActions({
  archived,
  customerId,
}: CustomerArchiveActionsProps) {
  const busy = useNavigation().state !== "idle";
  if (archived) {
    return (
      <Form
        method="post"
        action={`/customers/${customerId}/restore`}
        aria-busy={busy}
      >
        <button className={styles.restoreButton} disabled={busy}>
          {busy ? "Restoring…" : "Restore customer"}
        </button>
      </Form>
    );
  }
  return (
    <details className={styles.confirmation}>
      <summary>Archive customer</summary>
      <p>
        This customer will leave the active list. Their details will be
        preserved, and you can restore them later.
      </p>
      <Form
        method="post"
        action={`/customers/${customerId}/archive`}
        aria-busy={busy}
        className={styles.actions}
      >
        <button className={styles.archiveButton} disabled={busy}>
          {busy ? "Archiving…" : "Confirm archive"}
        </button>
        <button
          className={styles.cancelButton}
          type="button"
          disabled={busy}
          onClick={(event) =>
            event.currentTarget.closest("details")?.removeAttribute("open")
          }
        >
          Cancel
        </button>
      </Form>
    </details>
  );
}
