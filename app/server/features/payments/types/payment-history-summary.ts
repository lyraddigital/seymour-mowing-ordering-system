import type { customers } from "../../../db/schema/customers";
import type { invoices } from "../../../db/schema/invoices";
import type { PaymentSummary } from "./payment-summary";

export type PaymentHistorySummary = Pick<
  PaymentSummary,
  "id" | "invoiceId" | "amountCents" | "paymentDate" | "voidedAt"
> & {
  invoiceNumber: typeof invoices.$inferSelect.invoiceNumber;
  customerId: typeof customers.$inferSelect.id;
  customerName: typeof customers.$inferSelect.name;
};
