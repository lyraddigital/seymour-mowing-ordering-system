import { Form, Link, useNavigation } from "react-router";

import type { InvoiceDetailResult } from "../../../../../server/features/invoices/types/invoice-detail-result";
import Icon from "../../../../components/icon/icon";
import ui from "../../../../styles/product.module.css";
import styles from "./invoice-payments.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
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
    <section
      className={styles.section}
      aria-labelledby="invoice-payments-heading"
    >
      <header className={styles.header}>
        <div className={ui.sectionHeading}>
          <span className={ui.iconCircle}>
            <Icon name="payment" />
          </span>

          <div>
            <h2 id="invoice-payments-heading">Payments</h2>
            <p>Payment history recorded against this invoice.</p>
          </div>
        </div>

        {canManage &&
          invoice.status === "issued" &&
          invoice.balanceCents > 0 && (
            <Link
              className={ui.secondaryAction}
              to={`/invoices/${invoice.id}/payments/new`}
            >
              <Icon name="plus" />
              Record payment
            </Link>
          )}
      </header>

      {payments.length === 0 ? (
        <div className={styles.empty}>
          <p>No payments recorded.</p>
        </div>
      ) : (
        <div
          className={ui.tableScroll}
          role="region"
          aria-label="Invoice payments"
          tabIndex={0}
        >
          <table className={ui.table}>
            <thead>
              <tr>
                <th scope="col">Payment date</th>
                <th scope="col">Status</th>
                <th scope="col" className={ui.numeric}>
                  Amount
                </th>

                {canManage && invoice.status !== "draft" && (
                  <th scope="col">
                    <span className={styles.visuallyHidden}>Actions</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <time dateTime={payment.paymentDate}>
                      {dateFormatter.format(
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

                  <td className={ui.numeric}>
                    {currencyFormatter.format(payment.amountCents / 100)}
                  </td>

                  {canManage && invoice.status !== "draft" && (
                    <td className={styles.actions}>
                      {payment.voidedAt === null && (
                        <details className={styles.dangerConfirmation}>
                          <summary>Void payment</summary>

                          <div className={styles.dangerConfirmationBody}>
                            <p>
                              Void this payment? It will remain in history and
                              no longer count toward the amount paid.
                            </p>

                            <Form
                              method="post"
                              action={`/invoices/${invoice.id}/payments/${payment.id}/void`}
                            >
                              <button
                                className={ui.dangerAction}
                                type="submit"
                                disabled={submitting}
                              >
                                Confirm void payment
                              </button>
                            </Form>
                          </div>
                        </details>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
