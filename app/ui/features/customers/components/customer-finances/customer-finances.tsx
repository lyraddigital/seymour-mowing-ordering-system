import { Link } from "react-router";
import Icon from "../../../../components/icon/icon";
import type { CustomerFinancialHistory } from "../../../../../server/features/customers/types/customer-financial-history";
import ui from "../../../../styles/product.module.css";
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
const paymentDate = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const invoiceStatus = { draft: "Draft", issued: "Issued", voided: "Voided" };
interface CustomerFinancesProps {
  history: CustomerFinancialHistory;
}
export default function CustomerFinances({ history }: CustomerFinancesProps) {
  return (
    <div className={styles.finances}>
      <section
        className={styles.overview}
        aria-labelledby="financial-summary-heading"
      >
        <header className={ui.sectionHeading}>
          <span className={ui.iconCircle}>
            <Icon name="finance" />
          </span>
          <div>
            <h2 id="financial-summary-heading">Financial overview</h2>
            <p>Issued history, active payments and current balance.</p>
          </div>
        </header>
        <dl className={ui.metrics}>
          <div>
            <dt>Total invoiced</dt>
            <dd>
              <Icon name="invoice" />
              {currency.format(history.summary.totalInvoicedCents / 100)}
            </dd>
          </div>
          <div>
            <dt>Payments received</dt>
            <dd>
              <Icon name="payment" />
              {currency.format(history.summary.paidCents / 100)}
            </dd>
          </div>
          <div>
            <dt>Outstanding balance</dt>
            <dd>
              <Icon name="balance" />
              {currency.format(history.summary.outstandingCents / 100)}
            </dd>
          </div>
        </dl>
      </section>
      <section
        className={styles.historySection}
        aria-labelledby="customer-invoices-heading"
      >
        <header className={ui.sectionHeading}>
          <span className={ui.iconCircle}>
            <Icon name="invoice" />
          </span>
          <div>
            <h2 id="customer-invoices-heading">
              Invoice history{" "}
              <span className={styles.count}>{history.invoices.length}</span>
            </h2>
            <p>
              All invoices for this customer, including drafts, issued and
              voided invoices.
            </p>
          </div>
        </header>
        {history.invoices.length ? (
          <div
            className={ui.tableScroll}
            role="region"
            aria-label="Customer invoice history"
            tabIndex={0}
          >
            <table className={ui.table} aria-label="Customer invoices">
              <thead>
                <tr>
                  <th scope="col">Invoice</th>
                  <th scope="col">Status</th>
                  <th scope="col">Date</th>
                  <th scope="col" className={ui.numeric}>
                    Total
                  </th>
                  <th scope="col" className={ui.numeric}>
                    Paid
                  </th>
                  <th scope="col" className={ui.numeric}>
                    Balance
                  </th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {history.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <th scope="row">
                      <Link to={`/invoices/${invoice.id}`}>
                        {invoice.invoiceNumber ?? "Draft invoice"}
                      </Link>
                    </th>
                    <td>
                      <span className={ui[invoice.status]}>
                        {invoiceStatus[invoice.status]}
                      </span>
                    </td>
                    <td className={styles.date}>
                      <span className={styles.dateLabel}>
                        {invoice.issuedAt === null ? "Created" : "Issued"}
                      </span>
                      <time
                        dateTime={new Date(
                          invoice.issuedAt ?? invoice.createdAt,
                        ).toISOString()}
                      >
                        {date.format(
                          new Date(invoice.issuedAt ?? invoice.createdAt),
                        )}
                      </time>
                    </td>
                    <td className={ui.numeric}>
                      {currency.format(invoice.totalCents / 100)}
                    </td>
                    <td className={ui.numeric}>
                      {currency.format(invoice.paidCents / 100)}
                    </td>
                    <td className={ui.numeric}>
                      {invoice.status === "issued" ? (
                        currency.format(invoice.balanceCents / 100)
                      ) : (
                        <span className={styles.note}>Not payable</span>
                      )}
                    </td>
                    <td className={ui.view}>
                      <Link
                        to={`/invoices/${invoice.id}`}
                        aria-label={`View ${invoice.invoiceNumber ?? "draft invoice"}`}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.empty}>No invoices for this customer yet.</p>
        )}
      </section>
      <section
        className={styles.historySection}
        aria-labelledby="customer-payments-heading"
      >
        <header className={ui.sectionHeading}>
          <span className={ui.iconCircle}>
            <Icon name="payment" />
          </span>
          <div>
            <h2 id="customer-payments-heading">
              Payment history{" "}
              <span className={styles.count}>{history.payments.length}</span>
            </h2>
            <p>
              All recorded payments, including voided payments and payments on
              voided invoices.
            </p>
          </div>
        </header>
        {history.payments.length ? (
          <div
            className={ui.tableScroll}
            role="region"
            aria-label="Customer payment history"
            tabIndex={0}
          >
            <table className={ui.table} aria-label="Customer payments">
              <thead>
                <tr>
                  <th scope="col" className={ui.numeric}>
                    Amount
                  </th>
                  <th scope="col">Invoice</th>
                  <th scope="col">Payment date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {history.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className={ui.numeric}>
                      <strong>
                        {currency.format(payment.amountCents / 100)}
                      </strong>
                    </td>
                    <td>
                      <Link to={`/invoices/${payment.invoiceId}`}>
                        {payment.invoiceNumber ?? "Invoice"}
                      </Link>
                    </td>
                    <td className={styles.date}>
                      <time dateTime={payment.paymentDate}>
                        {paymentDate.format(
                          new Date(`${payment.paymentDate}T00:00:00Z`),
                        )}
                      </time>
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
                    <td className={ui.view}>
                      <Link
                        to={`/invoices/${payment.invoiceId}`}
                        aria-label={`View invoice for payment of ${currency.format(payment.amountCents / 100)}`}
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
          <p className={styles.empty}>
            No payments recorded for this customer yet.
          </p>
        )}
      </section>
    </div>
  );
}
