import { asc, eq, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { invoices } from "../../../db/schema/invoices";
import { jobs } from "../../../db/schema/jobs";
import { payments } from "../../../db/schema/payments";
import type { InvoiceDetailResult } from "../types/invoice-detail-result";

export async function getInvoiceById(
  binding: Env["DB"],
  user: CurrentUser,
  invoiceId: string,
): Promise<InvoiceDetailResult | null> {
  if (!can(user, "invoices.read")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  const invoice = await db
    .select({
      id: invoices.id,
      customerId: invoices.customerId,
      customerName: customers.name,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      issuedAt: invoices.issuedAt,
      voidedAt: invoices.voidedAt,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      totalCents: sql<number>`
        coalesce(
          (
            select sum(${invoiceItems.amountCents})
            from ${invoiceItems}
            where ${invoiceItems.invoiceId} = ${invoices.id}
          ),
          0
        )
      `,
    })
    .from(invoices)
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(eq(invoices.id, invoiceId))
    .get();

  if (!invoice) {
    return null;
  }

  const [invoiceJobRows, items, paymentHistory] = await Promise.all([
    db
      .select({
        id: jobs.id,
        name: jobs.name,
        scheduledDate: jobs.scheduledDate,
      })
      .from(invoiceJobs)
      .innerJoin(jobs, eq(jobs.id, invoiceJobs.jobId))
      .where(eq(invoiceJobs.invoiceId, invoiceId))
      .orderBy(asc(jobs.scheduledDate), asc(jobs.id)),

    db
      .select({
        id: invoiceItems.id,
        invoiceId: invoiceItems.invoiceId,
        jobId: invoiceItems.jobId,
        description: invoiceItems.description,
        amountCents: invoiceItems.amountCents,
        createdAt: invoiceItems.createdAt,
      })
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))
      .orderBy(asc(invoiceItems.createdAt), asc(invoiceItems.id)),
    db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(asc(payments.receivedAt), asc(payments.id)),
  ]);

  const paidCents = paymentHistory.reduce(
    (total, payment) =>
      total + (payment.voidedAt === null ? payment.amountCents : 0),
    0,
  );
  return {
    payments: paymentHistory,
    invoice: {
      ...invoice,
      paidCents,
      balanceCents: invoice.totalCents - paidCents,
      jobs: invoiceJobRows,
    },
    items,
  };
}
