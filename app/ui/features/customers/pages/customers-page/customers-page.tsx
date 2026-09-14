import { Link } from "react-router";

import type { CustomerSummary } from "../../../../../server/features/customers/types/customer-summary";
import CustomerList from "../../components/customer-list/customer-list";
import styles from "./customers-page.module.css";

export default function CustomersPage({
  customers,
}: {
  customers: CustomerSummary[];
}) {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">Customers</h1>
          <p className={styles.intro}>
            Your active customers and their contact details.
          </p>
        </div>

        <Link className={styles.primaryAction} to="/customers/new">
          New customer
        </Link>
      </header>

      <Link className={styles.archivedLink} to="/customers/archived">
        Archived customers
      </Link>

      {customers.length ? (
        <CustomerList customers={customers} />
      ) : (
        <div className={styles.emptyState}>
          <h2>No customers yet</h2>
          <p>
            Add your first customer to keep their contact and address details in
            one place.
          </p>

          <Link className={styles.primaryAction} to="/customers/new">
            Create customer
          </Link>
        </div>
      )}
    </section>
  );
}
