import type { payments } from "../../../db/schema/payments";

export type PaymentSummary = typeof payments.$inferSelect;
