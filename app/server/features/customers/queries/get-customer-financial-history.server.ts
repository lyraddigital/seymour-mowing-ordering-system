import { desc, eq, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoices } from "../../../db/schema/invoices";
import { payments } from "../../../db/schema/payments";
import type { CustomerFinancialHistory } from "../types/customer-financial-history";

export async function getCustomerFinancialHistory(
  binding: Env["DB"],
  user: CurrentUser,
  customerId: string,
): Promise<CustomerFinancialHistory> {
  if (
    !can(user, "customers.read") ||
    !can(user, "invoices.read") ||
    !can(user, "payments.read")
  ) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);
  const invoiceTotals = db
    .select({
      invoiceId: invoiceItems.invoiceId,
      totalCents: sql<number>`sum(${invoiceItems.amountCents})`.as(
        "total_cents",
      ),
    })
    .from(invoiceItems)
    .groupBy(invoiceItems.invoiceId)
    .as("invoice_totals");
  const [invoiceRows, paymentRows] = await db.batch([
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        createdAt: invoices.createdAt,
        issuedAt: invoices.issuedAt,
        totalCents: sql<number>`coalesce(${invoiceTotals.totalCents}, 0)`,
      })
      .from(invoices)
      .leftJoin(invoiceTotals, eq(invoiceTotals.invoiceId, invoices.id))
      .where(eq(invoices.customerId, customerId))
      .orderBy(desc(invoices.createdAt), desc(invoices.id)),
    db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        amountCents: payments.amountCents,
        receivedAt: payments.receivedAt,
        voidedAt: payments.voidedAt,
      })
      .from(payments)
      .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
      .where(eq(invoices.customerId, customerId))
      .orderBy(desc(payments.receivedAt), desc(payments.id)),
  ]);

  const paidByInvoice = new Map<string, number>();
  const summary = { totalInvoicedCents: 0, paidCents: 0, outstandingCents: 0 };
  for (const payment of paymentRows) {
    if (payment.voidedAt === null) {
      summary.paidCents += payment.amountCents;
      paidByInvoice.set(
        payment.invoiceId,
        (paidByInvoice.get(payment.invoiceId) ?? 0) + payment.amountCents,
      );
    }
  }
  const invoiceHistory = invoiceRows.map((invoice) => {
    const paidCents = paidByInvoice.get(invoice.id) ?? 0;
    const balanceCents = invoice.totalCents - paidCents;
    // Issued history includes voided invoices; only issued balances are payable.
    if (invoice.status !== "draft")
      summary.totalInvoicedCents += invoice.totalCents;
    if (invoice.status === "issued") summary.outstandingCents += balanceCents;
    return { ...invoice, paidCents, balanceCents };
  });

  return { summary, invoices: invoiceHistory, payments: paymentRows };
}
