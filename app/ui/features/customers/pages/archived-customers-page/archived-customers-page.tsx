import { Link } from "react-router";
import type { CustomerSummary } from "../../../../../server/features/customers/types/customer-summary";
import CustomerList from "../../components/customer-list/customer-list";
import styles from "../../../../styles/product.module.css";
export default function ArchivedCustomersPage({
  customers,
}: {
  customers: CustomerSummary[];
}) {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">Archived customers</h1>
          <p className={styles.intro}>
            Historical details are preserved. Open a customer to restore them.
          </p>
        </div>
      </header>
      <nav className={styles.tabs} aria-label="Customer lists">
        <Link to="/customers">Active customers</Link>
        <Link to="/customers/archived" aria-current="page">
          Archived customers
        </Link>
      </nav>
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
