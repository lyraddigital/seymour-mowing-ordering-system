import type { CustomerSummary } from "../../../server/features/customers/types/customer-summary";
import styles from "./customers-page.module.css";

export default function CustomerList({
  customers,
}: {
  customers: CustomerSummary[];
}) {
  return (
    <ul className={styles.list} aria-label="Active customers">
      {customers.map((customer) => {
        const locality = [customer.suburb, customer.state, customer.postcode]
          .filter(Boolean)
          .join(" ");
        const address = [customer.addressLine1, customer.addressLine2, locality]
          .filter(Boolean)
          .join(", ");
        return (
          <li key={customer.id} className={styles.customer}>
            <h2 className={styles.customerName}>{customer.name}</h2>
            {(customer.email || customer.phone) && (
              <dl className={styles.contact}>
                {customer.email && (
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={"mailto:" + customer.email}>{customer.email}</a>
                    </dd>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <dt>Phone</dt>
                    <dd>
                      <a href={"tel:" + customer.phone}>{customer.phone}</a>
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {address && (
              <dl className={styles.address}>
                <div>
                  <dt>Address</dt>
                  <dd>{address}</dd>
                </div>
              </dl>
            )}
          </li>
        );
      })}
    </ul>
  );
}
