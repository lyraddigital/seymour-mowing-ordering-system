import { asc, eq, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoices } from "../../../db/schema/invoices";
import { jobs } from "../../../db/schema/jobs";
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
      jobId: invoices.jobId,
      jobName: jobs.name,
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
    .innerJoin(jobs, eq(jobs.id, invoices.jobId))
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(eq(invoices.id, invoiceId))
    .get();

  if (!invoice) {
    return null;
  }

  const items = await db
    .select({
      id: invoiceItems.id,
      invoiceId: invoiceItems.invoiceId,
      description: invoiceItems.description,
      amountCents: invoiceItems.amountCents,
      createdAt: invoiceItems.createdAt,
    })
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId))
    .orderBy(asc(invoiceItems.createdAt), asc(invoiceItems.id));

  return {
    invoice,
    items,
  };
}
