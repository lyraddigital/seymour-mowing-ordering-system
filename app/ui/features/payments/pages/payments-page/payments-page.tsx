import { Link } from "react-router";

import type { PaymentHistorySummary } from "../../../../../server/features/payments/types/payment-history-summary";
import styles from "./payments-page.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});
const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

interface PaymentsPageProps {
  payments: PaymentHistorySummary[];
}

export default function PaymentsPage({ payments }: PaymentsPageProps) {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className="page-title">Payments</h1>
        <p className={styles.intro}>
          Recorded payments across all invoices, including voided payments.
        </p>
      </header>

      {payments.length ? (
        <ul className={styles.list} aria-label="Payments">
          {payments.map((payment) => (
            <li className={styles.payment} key={payment.id}>
              <div className={styles.identity}>
                <strong className={styles.amount}>
                  {currencyFormatter.format(payment.amountCents / 100)}
                </strong>
                <span
                  className={`${styles.status} ${payment.voidedAt === null ? styles.active : styles.voided}`}
                >
                  {payment.voidedAt === null ? "Active" : "Voided"}
                </span>
              </div>
              <div className={styles.context}>
                <div>
                  <span className={styles.label}>Invoice</span>
                  <Link to={`/invoices/${payment.invoiceId}`}>
                    {payment.invoiceNumber ?? "Invoice"}
                  </Link>
                </div>
                <div>
                  <span className={styles.label}>Customer</span>
                  <Link to={`/customers/${payment.customerId}`}>
                    {payment.customerName}
                  </Link>
                </div>
              </div>
              <div className={styles.context}>
                <div>
                  <span className={styles.label}>Received</span>
                  <time dateTime={new Date(payment.receivedAt).toISOString()}>
                    {dateFormatter.format(new Date(payment.receivedAt))}
                  </time>
                </div>
                {payment.voidedAt !== null && (
                  <div>
                    <span className={styles.label}>Voided</span>
                    <time dateTime={new Date(payment.voidedAt).toISOString()}>
                      {dateFormatter.format(new Date(payment.voidedAt))}
                    </time>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.emptyState}>
          <h2>No payments yet</h2>
          <p>Payments recorded on invoices will appear here.</p>
          <Link to="/invoices">View invoices</Link>
        </div>
      )}
    </section>
  );
}
