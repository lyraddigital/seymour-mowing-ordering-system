import { Link } from "react-router";
import type { CustomerSummary } from "../../../../../server/features/customers/types/customer-summary";
import ui from "../../../../styles/product.module.css";
import styles from "./customer-list.module.css";

export default function CustomerList({
  customers,
  label = "Active customers",
}: {
  customers: CustomerSummary[];
  label?: string;
}) {
  return (
    <div
      className={ui.tableScroll}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table className={ui.table} aria-label={label}>
        <thead>
          <tr>
            <th scope="col">Customer</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Address</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => {
            const locality = [
              customer.suburb,
              customer.state,
              customer.postcode,
            ]
              .filter(Boolean)
              .join(" ");
            const address = [
              customer.addressLine1,
              customer.addressLine2,
              locality,
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <tr key={customer.id}>
                <th scope="row" className={styles.name}>
                  <Link to={`/customers/${customer.id}`}>{customer.name}</Link>
                </th>
                <td>
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`}>{customer.email}</a>
                  ) : (
                    <span className={styles.missing}>—</span>
                  )}
                </td>
                <td className={styles.phone}>
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                  ) : (
                    <span className={styles.missing}>—</span>
                  )}
                </td>
                <td className={styles.address}>
                  {address || "No address added"}
                </td>
                <td className={ui.view}>
                  <Link
                    to={`/customers/${customer.id}`}
                    aria-label={`View ${customer.name}`}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
