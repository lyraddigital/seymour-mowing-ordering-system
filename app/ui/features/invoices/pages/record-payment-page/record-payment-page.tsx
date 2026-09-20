import { Form, Link, useNavigation } from "react-router";
import type { InvoiceDetailResult } from "../../../../../server/features/invoices/types/invoice-detail-result";
import styles from "./record-payment-page.module.css";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});
interface RecordPaymentPageProps {
  invoice: InvoiceDetailResult["invoice"];
  values?: { amount: string };
  errorMessage?: string;
}
export default function RecordPaymentPage({
  invoice,
  values,
  errorMessage,
}: RecordPaymentPageProps) {
  const saving = useNavigation().state !== "idle";
  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to={`/invoices/${invoice.id}`}>
        ← Invoice details
      </Link>
      <header className={styles.header}>
        <h1 className="page-title">Record payment</h1>
        <p className={styles.intro}>
          {invoice.invoiceNumber} · {invoice.customerName}
        </p>
      </header>
      <dl className={styles.context}>
        <div>
          <dt>Invoice total</dt>
          <dd>{currencyFormatter.format(invoice.totalCents / 100)}</dd>
        </div>
        <div>
          <dt>Already paid</dt>
          <dd>{currencyFormatter.format(invoice.paidCents / 100)}</dd>
        </div>
        <div>
          <dt>Remaining balance</dt>
          <dd>{currencyFormatter.format(invoice.balanceCents / 100)}</dd>
        </div>
      </dl>
      <Form method="post" className={styles.form} aria-busy={saving}>
        <label htmlFor="amount">Payment amount</label>
        <div className={styles.moneyField}>
          <span aria-hidden="true">$</span>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            required
            placeholder="0.00"
            defaultValue={values?.amount ?? ""}
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? "amount-error" : undefined}
          />
        </div>
        {errorMessage && (
          <p className={styles.fieldError} id="amount-error" role="alert">
            {errorMessage}
          </p>
        )}
        <div className={styles.actions}>
          <button
            className={styles.primaryAction}
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Record payment"}
          </button>
          <Link
            className={styles.secondaryAction}
            to={`/invoices/${invoice.id}`}
          >
            Cancel
          </Link>
        </div>
      </Form>
    </section>
  );
}
