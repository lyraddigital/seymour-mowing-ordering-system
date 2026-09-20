import type { PaymentSummary } from "../../payments/types/payment-summary";
import type { InvoiceItemSummary } from "./invoice-item-summary";
import type { InvoiceSummary } from "./invoice-summary";

export interface InvoiceDetailResult {
  invoice: InvoiceSummary & { paidCents: number; balanceCents: number };
  payments: PaymentSummary[];
  items: InvoiceItemSummary[];
}
