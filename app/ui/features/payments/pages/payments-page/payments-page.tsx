import { Link } from "react-router";

import type { PaymentHistorySummary } from "../../../../../server/features/payments/types/payment-history-summary";
import ui from "../../../../styles/product.module.css";
import styles from "./payments-page.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

interface PaymentsPageProps {
  payments: PaymentHistorySummary[];
}

export default function PaymentsPage({ payments }: PaymentsPageProps) {
  return (
    <section className={ui.page}>
      <header className={ui.header}>
        <div>
          <h1 className="page-title">Payments</h1>

          <p className={ui.intro}>
            Recorded payments across all invoices, including voided payments.
          </p>
        </div>
      </header>

      {payments.length ? (
        <div
          className={ui.tableScroll}
          role="region"
          aria-label="Payments"
          tabIndex={0}
        >
          <table className={ui.table} aria-label="Payments">
            <thead>
              <tr>
                <th scope="col">Payment date</th>
                <th scope="col">Customer</th>
                <th scope="col">Invoice</th>
                <th scope="col">Status</th>
                <th scope="col" className={ui.numeric}>
                  Amount
                </th>
                <th scope="col">Details</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className={styles.received}>
                    <time dateTime={payment.paymentDate}>
                      {dateFormatter.format(
                        new Date(`${payment.paymentDate}T00:00:00Z`),
                      )}
                    </time>
                  </td>

                  <td className={styles.customer}>
                    <Link to={`/customers/${payment.customerId}`}>
                      {payment.customerName}
                    </Link>
                  </td>

                  <td className={styles.invoice}>
                    <Link to={`/invoices/${payment.invoiceId}`}>
                      {payment.invoiceNumber ?? "Invoice"}
                    </Link>
                  </td>

                  <td>
                    <span
                      className={
                        payment.voidedAt === null ? ui.active : ui.voided
                      }
                    >
                      {payment.voidedAt === null ? "Active" : "Voided"}
                    </span>
                  </td>

                  <td className={ui.numeric}>
                    {currencyFormatter.format(payment.amountCents / 100)}
                  </td>

                  <td className={ui.view}>
                    <Link
                      to={`/invoices/${payment.invoiceId}`}
                      aria-label={`View invoice ${payment.invoiceNumber ?? ""}`}
                    >
                      View invoice →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={ui.emptyState}>
          <h2>No payments yet</h2>

          <p>Payments recorded on invoices will appear here.</p>

          <Link className={ui.secondaryAction} to="/invoices">
            View invoices
          </Link>
        </div>
      )}
    </section>
  );
}
