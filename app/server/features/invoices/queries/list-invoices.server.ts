import { asc, desc, eq, inArray, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { invoices } from "../../../db/schema/invoices";
import { jobs } from "../../../db/schema/jobs";
import type { InvoiceJobSummary } from "../types/invoice-job-summary";
import type { InvoiceSummary } from "../types/invoice-summary";

export async function listInvoices(
  binding: Env["DB"],
  user: CurrentUser,
): Promise<InvoiceSummary[]> {
  if (!can(user, "invoices.read")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  const invoiceRows = await db
    .select({
      id: invoices.id,
      customerId: invoices.customerId,
      customerName: customers.name,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      dueDate: invoices.dueDate,
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
    .orderBy(desc(invoices.createdAt), desc(invoices.id));

  if (!invoiceRows.length) {
    return [];
  }

  const jobRows = await db
    .select({
      invoiceId: invoiceJobs.invoiceId,
      id: jobs.id,
      name: jobs.name,
      scheduledDate: jobs.scheduledDate,
    })
    .from(invoiceJobs)
    .innerJoin(jobs, eq(jobs.id, invoiceJobs.jobId))
    .where(
      inArray(
        invoiceJobs.invoiceId,
        invoiceRows.map((invoice) => invoice.id),
      ),
    )
    .orderBy(asc(jobs.scheduledDate), asc(jobs.id));

  const jobsByInvoice = new Map<string, InvoiceJobSummary[]>();

  for (const job of jobRows) {
    const existing = jobsByInvoice.get(job.invoiceId) ?? [];

    existing.push({
      id: job.id,
      name: job.name,
      scheduledDate: job.scheduledDate,
    });

    jobsByInvoice.set(job.invoiceId, existing);
  }

  return invoiceRows.map((invoice) => ({
    ...invoice,
    jobs: jobsByInvoice.get(invoice.id) ?? [],
  }));
}
