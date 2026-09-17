import { desc, eq, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoices } from "../../../db/schema/invoices";
import { jobs } from "../../../db/schema/jobs";
import type { InvoiceSummary } from "../types/invoice-summary";

export async function listInvoices(
  binding: Env["DB"],
  user: CurrentUser,
): Promise<InvoiceSummary[]> {
  if (!can(user, "invoices.read")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  return db
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
        coalesce(sum(${invoiceItems.amountCents}), 0)
      `,
    })
    .from(invoices)
    .innerJoin(jobs, eq(jobs.id, invoices.jobId))
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .leftJoin(invoiceItems, eq(invoiceItems.invoiceId, invoices.id))
    .groupBy(
      invoices.id,
      invoices.jobId,
      jobs.name,
      invoices.customerId,
      customers.name,
      invoices.invoiceNumber,
      invoices.status,
      invoices.issuedAt,
      invoices.voidedAt,
      invoices.createdAt,
      invoices.updatedAt,
    )
    .orderBy(desc(invoices.createdAt), desc(invoices.id));
}
