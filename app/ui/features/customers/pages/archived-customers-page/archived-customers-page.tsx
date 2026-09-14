import { Link } from "react-router";
import type { CustomerSummary } from "../../../../../server/features/customers/types/customer-summary";
import CustomerList from "../../components/customer-list/customer-list";
import styles from "./archived-customers-page.module.css";

export default function ArchivedCustomersPage({
  customers,
}: {
  customers: CustomerSummary[];
}) {
  return (
    <section className={styles.page}>
      <Link className={styles.archivedLink} to="/customers">
        ← Active customers
      </Link>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">Archived customers</h1>
          <p className={styles.intro}>
            Inactive customers. Their details are preserved and can be restored.
          </p>
        </div>
      </header>
      {customers.length ? (
        <CustomerList customers={customers} label="Archived customers" />
      ) : (
        <div className={styles.emptyState}>
          <h2>No archived customers</h2>
          <p>Customers you archive will appear here.</p>
        </div>
      )}
    </section>
  );
}
