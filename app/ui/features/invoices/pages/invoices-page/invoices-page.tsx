import { Link } from "react-router";
import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import InvoiceList from "../../components/invoice-list/invoice-list";
import styles from "./invoices-page.module.css";

interface InvoicesPageProps {
  invoices: InvoiceSummary[];
  canManage: boolean;
}

export default function InvoicesPage({
  canManage,
  invoices,
}: InvoicesPageProps) {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className={styles.intro}>
            Draft, issued and voided invoices for your customers.
          </p>
        </div>
        {canManage && (
          <Link className={styles.createAction} to="/invoices/new">
            Create invoice
          </Link>
        )}
      </header>

      {invoices.length ? (
        <InvoiceList invoices={invoices} />
      ) : (
        <div className={styles.emptyState}>
          <h2>No invoices yet</h2>
          <p>Invoices created from jobs will appear here.</p>
        </div>
      )}
    </section>
  );
}
