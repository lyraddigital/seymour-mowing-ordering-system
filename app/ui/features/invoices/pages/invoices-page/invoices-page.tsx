import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import InvoiceList from "../../components/invoice-list/invoice-list";
import styles from "./invoices-page.module.css";

interface InvoicesPageProps {
  invoices: InvoiceSummary[];
}

export default function InvoicesPage({ invoices }: InvoicesPageProps) {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className={styles.intro}>
            Draft, issued and voided invoices for your customers.
          </p>
        </div>
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
