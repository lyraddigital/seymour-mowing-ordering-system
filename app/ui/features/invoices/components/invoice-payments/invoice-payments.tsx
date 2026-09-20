import { Form, Link, useNavigation } from "react-router";
import type { InvoiceDetailResult } from "../../../../../server/features/invoices/types/invoice-detail-result";
import styles from "./invoice-payments.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});
const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
interface InvoicePaymentsProps {
  invoice: InvoiceDetailResult["invoice"];
  payments: InvoiceDetailResult["payments"];
  canManage: boolean;
}
export default function InvoicePayments({
  invoice,
  payments,
  canManage,
}: InvoicePaymentsProps) {
  const submitting = useNavigation().state !== "idle";
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2>Payments</h2>
        {canManage &&
          invoice.status === "issued" &&
          invoice.balanceCents > 0 && (
            <Link
              className={styles.secondaryAction}
              to={`/invoices/${invoice.id}/payments/new`}
            >
              Record payment
            </Link>
          )}
      </header>
      <dl className={styles.totals}>
        <div>
          <dt>Amount paid</dt>
          <dd>{currencyFormatter.format(invoice.paidCents / 100)}</dd>
        </div>
        <div>
          <dt>
            {invoice.status === "voided"
              ? "Historical balance"
              : "Remaining balance"}
          </dt>
          <dd>{currencyFormatter.format(invoice.balanceCents / 100)}</dd>
        </div>
      </dl>
      {payments.length === 0 ? (
        <p className={styles.empty}>No payments recorded.</p>
      ) : (
        <ul className={styles.payments}>
          {payments.map((payment) => (
            <li key={payment.id}>
              <div className={styles.paymentDetails}>
                <strong>
                  {currencyFormatter.format(payment.amountCents / 100)}
                </strong>
                <span>
                  Received {dateFormatter.format(new Date(payment.receivedAt))}
                </span>
                <span>
                  {payment.voidedAt === null
                    ? "Active"
                    : `Voided ${dateFormatter.format(new Date(payment.voidedAt))}`}
                </span>
              </div>
              {canManage &&
                invoice.status !== "draft" &&
                payment.voidedAt === null && (
                  <details className={styles.dangerConfirmation}>
                    <summary>Void payment</summary>
                    <div className={styles.dangerConfirmationBody}>
                      <p>
                        Void this payment? It will remain in history and no
                        longer count toward the amount paid.
                      </p>
                      <Form
                        method="post"
                        action={`/invoices/${invoice.id}/payments/${payment.id}/void`}
                      >
                        <button
                          className={styles.dangerAction}
                          type="submit"
                          disabled={submitting}
                        >
                          Confirm void payment
                        </button>
                      </Form>
                    </div>
                  </details>
                )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
