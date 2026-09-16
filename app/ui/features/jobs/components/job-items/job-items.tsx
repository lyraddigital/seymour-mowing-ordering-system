import type { JobItemSummary } from "~/server/features/jobs/types/ob-item-summary";
import styles from "./job-items.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

interface JobItemsProps {
  items: JobItemSummary[];
  totalCents: number;
}

export default function JobItems({ items, totalCents }: JobItemsProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2>Items</h2>
          <p>Work and charges recorded against this job.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No items have been added yet.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {items.map((item) => (
              <li className={styles.item} key={item.id}>
                <span className={styles.description}>{item.description}</span>

                <span className={styles.amount}>
                  {currencyFormatter.format(item.amountCents / 100)}
                </span>
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
