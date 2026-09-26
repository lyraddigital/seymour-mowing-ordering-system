import { desc, eq } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { invoices } from "../../../db/schema/invoices";
import { payments } from "../../../db/schema/payments";
import type { PaymentHistorySummary } from "../types/payment-history-summary";

export async function listPayments(
  binding: Env["DB"],
  user: CurrentUser,
): Promise<PaymentHistorySummary[]> {
  if (!can(user, "payments.read")) {
    throw new PermissionDeniedError();
  }

  return createDb(binding)
    .select({
      id: payments.id,
      invoiceId: payments.invoiceId,
      amountCents: payments.amountCents,
      paymentDate: payments.paymentDate,
      voidedAt: payments.voidedAt,
      invoiceNumber: invoices.invoiceNumber,
      customerId: customers.id,
      customerName: customers.name,
    })
    .from(payments)
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .orderBy(
      desc(payments.paymentDate),
      desc(payments.createdAt),
      desc(payments.id),
    );
}
