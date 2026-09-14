import { Link } from "react-router";

import type { CustomerDetails } from "../../../../../server/features/customers/types/customer-details";
import styles from "./customer-page.module.css";

export default function CustomerPage({
  customer,
  canManage,
}: {
  customer: CustomerDetails;
  canManage: boolean;
}) {
  const locality = [customer.suburb, customer.state, customer.postcode]
    .filter(Boolean)
    .join(" ");

  const address = [
    customer.addressLine1,
    customer.addressLine2,
    locality,
  ].filter(Boolean);

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to="/customers">
        ← Customers
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className="page-title">{customer.name}</h1>
          <p className={styles.intro}>Customer details</p>
        </div>
        {canManage && (
          <Link
            className={styles.primaryAction}
            to={`/customers/${customer.id}/edit`}
          >
            Edit customer
          </Link>
        )}
      </header>

      <div className={styles.detailsGrid}>
        <section className={styles.detailCard}>
          <h2>Contact</h2>

          {customer.email || customer.phone ? (
            <dl className={styles.detailList}>
              {customer.email && (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${customer.email}`}>{customer.email}</a>
                  </dd>
                </div>
              )}

              {customer.phone && (
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className={styles.mutedDetail}>No contact details added.</p>
          )}
        </section>

        <section className={styles.detailCard}>
          <h2>Address</h2>

          {address.length ? (
            <address className={styles.customerAddress}>
              {address.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </address>
          ) : (
            <p className={styles.mutedDetail}>No address added.</p>
          )}
        </section>

        <section className={`${styles.detailCard} ${styles.notesCard}`}>
          <h2>Notes</h2>

          {customer.notes ? (
            <p className={styles.customerNotes}>{customer.notes}</p>
          ) : (
            <p className={styles.mutedDetail}>No notes added.</p>
          )}
        </section>
      </div>
    </section>
  );
}
