import { Form, Link } from "react-router";

import type { JobItemSummary } from "~/server/features/jobs/types/job-item-summary";
import styles from "./job-items.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

interface JobItemsProps {
  jobId: string;
  items: JobItemSummary[];
  totalCents: number;
  canManage: boolean;
}

export default function JobItems({
  jobId,
  items,
  totalCents,
  canManage,
}: JobItemsProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2>Items</h2>
          <p>Work and charges recorded against this job.</p>
        </div>
        {canManage && (
          <Link className={styles.addAction} to={`/jobs/${jobId}/items/new`}>
            Add item
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No items have been added yet.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {items.map((item) => (
              <li className={styles.item} key={item.id}>
                <span className={styles.description}>{item.description}</span>

                <div className={styles.itemActions}>
                  <span className={styles.amount}>
                    {currencyFormatter.format(item.amountCents / 100)}
                  </span>

                  {canManage && (
                    <div className={styles.managementActions}>
                      <Link
                        className={styles.editAction}
                        to={`/jobs/${jobId}/items/${item.id}/edit`}
                      >
                        Edit
                      </Link>

                      <details className={styles.removeConfirmation}>
                        <summary>Remove</summary>

                        <div className={styles.removeConfirmationBody}>
                          <p>Remove this item from the job?</p>

                          <Form
                            method="post"
                            action={`/jobs/${jobId}/items/${item.id}/delete`}
                          >
                            <button
                              className={styles.removeAction}
                              type="submit"
                            >
                              Confirm remove
                            </button>
                          </Form>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.total}>
            <span>Total</span>
            <strong>{currencyFormatter.format(totalCents / 100)}</strong>
          </div>
        </>
      )}
    </section>
  );
}
