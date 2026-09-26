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
import type { RecordPaymentInput } from "../types/record-payment-input";
import { validateRecordPayment } from "../validation/validate-record-payment";

function getMelbourneDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const part = (name: string) =>
    parts.find((entry) => entry.type === name)?.value;

  const year = part("year");
  const month = part("month");
  const day = part("day");

  if (!year || !month || !day) {
    throw new Error("Could not determine Melbourne calendar date.");
  }

  return `${year}-${month}-${day}`;
}

export async function recordPayment(
  binding: Env["DB"],
  user: CurrentUser,
  invoiceId: string,
  input: RecordPaymentInput,
  now = new Date(),
) {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const validated = validateRecordPayment(input, getMelbourneDate(now));
  const db = createDb(binding);
  const id = crypto.randomUUID();
  const createdAt = now.getTime();

  // Check status and remaining balance in the write itself, not a prior read.
  // D1 serializes writes, so concurrent payments cannot both spend the same balance.
  const created = await db
    .insert(payments)
    .select(
      db
        .select({
          id: sql<string>`${id}`.as("id"),
          invoiceId: invoices.id,
          amountCents: sql<number>`${validated.amountCents}`.as("amount_cents"),
          paymentDate: sql<string>`${validated.paymentDate}`.as("payment_date"),
          voidedAt: sql<null>`null`.as("voided_at"),
          createdAt: sql<number>`${createdAt}`.as("created_at"),
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.id, invoiceId),
            eq(invoices.status, "issued"),
            sql`${validated.amountCents} <=
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
