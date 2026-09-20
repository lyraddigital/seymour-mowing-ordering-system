import { and, eq, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoices } from "../../../db/schema/invoices";
import { payments } from "../../../db/schema/payments";
import { InvoiceNotFoundError } from "../../invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../../invoices/errors/invoice-state-conflict-error";
import { PaymentOverpaymentError } from "../errors/payment-overpayment-error";
import { PaymentValidationError } from "../errors/payment-validation-error";
import type { RecordPaymentInput } from "../types/record-payment-input";

export async function recordPayment(
  binding: Env["DB"],
  user: CurrentUser,
  invoiceId: string,
  input: RecordPaymentInput,
) {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    throw new PaymentValidationError();
  }
  const db = createDb(binding);
  const id = crypto.randomUUID();
  const now = Date.now();
  // Check status and remaining balance in the write itself, not a prior read.
  // D1 serializes writes, so concurrent payments cannot both spend the same balance.
  const created = await db
    .insert(payments)
    .select(
      db
        .select({
          id: sql<string>`${id}`.as("id"),
          invoiceId: invoices.id,
          amountCents: sql<number>`${input.amountCents}`.as("amount_cents"),
          receivedAt: sql<number>`${now}`.as("received_at"),
          voidedAt: sql<null>`null`.as("voided_at"),
          createdAt: sql<number>`${now}`.as("created_at"),
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.id, invoiceId),
            eq(invoices.status, "issued"),
            sql`${input.amountCents} <=
        coalesce((select sum(${invoiceItems.amountCents}) from ${invoiceItems} where ${invoiceItems.invoiceId} = ${invoices.id}), 0)
        - coalesce((select sum(${payments.amountCents}) from ${payments} where ${payments.invoiceId} = ${invoices.id} and ${payments.voidedAt} is null), 0)`,
          ),
        ),
    )
    .returning({ id: payments.id });
  if (created.length) {
    return created[0];
  }
  const invoice = await db
    .select({ status: invoices.status })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();
  if (!invoice) {
    throw new InvoiceNotFoundError();
  }
  if (invoice.status !== "issued") {
    throw new InvoiceStateConflictError(
      "Payments can only be recorded against issued invoices.",
    );
  }
  throw new PaymentOverpaymentError();
}
