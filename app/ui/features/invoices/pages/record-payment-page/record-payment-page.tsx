import { Form, Link, useNavigation } from "react-router";

import type { InvoiceDetailResult } from "../../../../../server/features/invoices/types/invoice-detail-result";
import ui from "../../../../styles/product.module.css";
import styles from "./record-payment-page.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

interface RecordPaymentPageProps {
  invoice: InvoiceDetailResult["invoice"];
  values?: {
    amount: string;
  };
  errorMessage?: string;
}

export default function RecordPaymentPage({
  invoice,
  values,
  errorMessage,
}: RecordPaymentPageProps) {
  const saving = useNavigation().state !== "idle";

  return (
    <section className={`${ui.page} ${styles.page}`}>
      <div className={styles.breadcrumb}>
        <Link className={ui.breadcrumb} to="/invoices">
          Invoices
        </Link>

        <span aria-hidden="true">›</span>

        <Link className={ui.breadcrumb} to={`/invoices/${invoice.id}`}>
          {invoice.invoiceNumber ?? "Invoice"}
        </Link>

        <span aria-hidden="true">›</span>
        <span>Record payment</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">Record payment</h1>

          <p className={ui.intro}>
            Record a payment received for {invoice.invoiceNumber} from{" "}
            {invoice.customerName}.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <Form method="post" className={styles.form} aria-busy={saving}>
          <section
            className={styles.formSection}
            aria-labelledby="payment-details-heading"
          >
            <header className={styles.sectionHeader}>
              <h2 id="payment-details-heading">Payment details</h2>

              <p>
                Enter the amount received. The payment time is recorded
                automatically when you submit this form.
              </p>
            </header>

            <div className={styles.field}>
              <label htmlFor="amount">Payment amount</label>

              <div
                className={`${styles.moneyField} ${
                  errorMessage ? styles.moneyFieldError : ""
                }`}
              >
                <span aria-hidden="true">$</span>

                <input
                  id="amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0.00"
                  autoComplete="off"
                  defaultValue={values?.amount ?? ""}
                  aria-invalid={!!errorMessage}
                  aria-describedby={
                    errorMessage ? "amount-error" : "amount-hint"
                  }
                />
              </div>

              {errorMessage ? (
                <p className={styles.fieldError} id="amount-error" role="alert">
                  {errorMessage}
                </p>
              ) : (
                <p className={styles.fieldHint} id="amount-hint">
                  Enter an amount greater than zero and no more than the
                  remaining balance of{" "}
                  {currencyFormatter.format(invoice.balanceCents / 100)}.
                </p>
              )}
            </div>
          </section>

          <footer className={styles.actions}>
            <button
              className={ui.primaryAction}
              type="submit"
              disabled={saving}
            >
              {saving ? "Recording…" : "Record payment"}
            </button>

            <Link className={ui.secondaryAction} to={`/invoices/${invoice.id}`}>
              Cancel
            </Link>

            <span className={styles.savingStatus} role="status">
              {saving ? "Recording payment…" : ""}
            </span>
          </footer>
        </Form>

        <aside
          className={styles.summary}
          aria-labelledby="invoice-summary-heading"
        >
          <h2 id="invoice-summary-heading">Invoice summary</h2>

          <dl>
            <div>
              <dt>Invoice</dt>
              <dd>{invoice.invoiceNumber}</dd>
            </div>

            <div>
              <dt>Customer</dt>
              <dd>{invoice.customerName}</dd>
            </div>

            <div>
              <dt>Invoice total</dt>
              <dd>{currencyFormatter.format(invoice.totalCents / 100)}</dd>
            </div>

            <div>
              <dt>Already paid</dt>
              <dd>{currencyFormatter.format(invoice.paidCents / 100)}</dd>
            </div>

            <div className={styles.balance}>
              <dt>Remaining balance</dt>
              <dd>{currencyFormatter.format(invoice.balanceCents / 100)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
