import { Link } from "react-router";
import type { CustomerFinancialHistory } from "../../../../../server/features/customers/types/customer-financial-history";
import styles from "./customer-finances.module.css";

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});
const date = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dateTime = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const invoiceStatus = { draft: "Draft", issued: "Issued", voided: "Voided" };

interface CustomerFinancesProps {
  history: CustomerFinancialHistory;
}

export default function CustomerFinances({ history }: CustomerFinancesProps) {
  return (
    <div className={styles.finances}>
      <section
        className={styles.card}
        aria-labelledby="financial-summary-heading"
      >
        <h2 id="financial-summary-heading">Financial summary</h2>
        <dl className={styles.summary}>
          <div>
            <dt>Total invoiced</dt>
            <dd>{currency.format(history.summary.totalInvoicedCents / 100)}</dd>
          </div>
          <div>
            <dt>Active payments received</dt>
            <dd>{currency.format(history.summary.paidCents / 100)}</dd>
          </div>
          <div>
            <dt>Outstanding balance</dt>
            <dd>{currency.format(history.summary.outstandingCents / 100)}</dd>
          </div>
        </dl>
        <p className={styles.note}>
          Total invoiced includes issued and voided invoices. Active payments
          include payments on voided invoices. Only issued invoices contribute
          to outstanding balance.
        </p>
      </section>

      <section
        className={styles.card}
        aria-labelledby="customer-invoices-heading"
      >
        <h2 id="customer-invoices-heading">Invoices</h2>
        {history.invoices.length ? (
          <ul className={styles.list} aria-label="Customer invoices">
            {history.invoices.map((invoice) => (
              <li className={styles.row} key={invoice.id}>
                <div className={styles.identity}>
                  <Link to={`/invoices/${invoice.id}`}>
                    {invoice.invoiceNumber ?? "Draft invoice"}
                  </Link>
                  <span
                    className={`${styles.status} ${styles[invoice.status]}`}
                  >
                    {invoiceStatus[invoice.status]}
                  </span>
                  <span className={styles.note}>
                    {invoice.issuedAt === null ? "Created " : "Issued "}
                    <time
                      dateTime={new Date(
                        invoice.issuedAt ?? invoice.createdAt,
                      ).toISOString()}
                    >
                      {date.format(
                        new Date(invoice.issuedAt ?? invoice.createdAt),
                      )}
                    </time>
                  </span>
                </div>
                <dl className={styles.amounts}>
                  <div>
                    <dt>Total</dt>
                    <dd>{currency.format(invoice.totalCents / 100)}</dd>
                  </div>
                  <div>
                    <dt>Paid</dt>
                    <dd>{currency.format(invoice.paidCents / 100)}</dd>
                  </div>
                  {invoice.status === "issued" && (
                    <div>
                      <dt>Remaining balance</dt>
                      <dd>{currency.format(invoice.balanceCents / 100)}</dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>No invoices for this customer yet.</p>
        )}
      </section>

      <section
        className={styles.card}
        aria-labelledby="customer-payments-heading"
      >
        <h2 id="customer-payments-heading">Payments</h2>
        {history.payments.length ? (
          <ul className={styles.list} aria-label="Customer payments">
            {history.payments.map((payment) => (
              <li className={styles.row} key={payment.id}>
                <div className={styles.identity}>
                  <strong>{currency.format(payment.amountCents / 100)}</strong>
                  <span
                    className={`${styles.status} ${payment.voidedAt === null ? styles.active : styles.voided}`}
                  >
                    {payment.voidedAt === null ? "Active" : "Voided"}
                  </span>
                </div>
                <div className={styles.identity}>
                  <Link to={`/invoices/${payment.invoiceId}`}>
                    {payment.invoiceNumber ?? "Invoice"}
                  </Link>
                  <span className={styles.note}>
                    Received{" "}
                    <time dateTime={new Date(payment.receivedAt).toISOString()}>
                      {dateTime.format(new Date(payment.receivedAt))}
                    </time>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>
            No payments recorded for this customer yet.
          </p>
        )}
      </section>
    </div>
  );
}
