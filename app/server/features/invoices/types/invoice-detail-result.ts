import type { InvoiceItemSummary } from "./invoice-item-summary";
import type { InvoiceSummary } from "./invoice-summary";

export interface InvoiceDetailResult {
  invoice: InvoiceSummary;
  items: InvoiceItemSummary[];
}
