import type { InvoiceSummary } from "../../invoices/types/invoice-summary";
import type { PaymentHistorySummary } from "../../payments/types/payment-history-summary";

export interface CustomerFinancialHistory {
  summary: {
    totalInvoicedCents: number;
    paidCents: number;
    outstandingCents: number;
  };
  invoices: (Pick<
    InvoiceSummary,
    "id" | "invoiceNumber" | "status" | "createdAt" | "issuedAt" | "totalCents"
  > & { paidCents: number; balanceCents: number })[];
  payments: Pick<
    PaymentHistorySummary,
    | "id"
    | "invoiceId"
    | "invoiceNumber"
    | "amountCents"
    | "receivedAt"
    | "voidedAt"
  >[];
}
