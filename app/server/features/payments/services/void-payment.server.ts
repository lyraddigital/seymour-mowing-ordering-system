import { and, eq, isNull } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoices } from "../../../db/schema/invoices";
import { payments } from "../../../db/schema/payments";
import { InvoiceNotFoundError } from "../../invoices/errors/invoice-not-found-error";
import { PaymentNotFoundError } from "../errors/payment-not-found-error";
import { PaymentStateConflictError } from "../errors/payment-state-conflict-error";

export async function voidPayment(
  binding: Env["DB"],
  user: CurrentUser,
  invoiceId: string,
  paymentId: string,
) {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }
  const db = createDb(binding);
  const voided = await db
    .update(payments)
    .set({ voidedAt: Date.now() })
    .where(
      and(
        eq(payments.id, paymentId),
        eq(payments.invoiceId, invoiceId),
        isNull(payments.voidedAt),
      ),
    )
    .returning({ id: payments.id })
    .get();
  if (voided) {
    return voided;
  }
  const invoice = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();
  if (!invoice) {
    throw new InvoiceNotFoundError();
  }
  const payment = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.invoiceId, invoiceId)))
    .get();
  if (!payment) {
    throw new PaymentNotFoundError();
  }
  throw new PaymentStateConflictError();
}
