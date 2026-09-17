import { eq, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoices } from "../../../db/schema/invoices";
import { jobItems } from "../../../db/schema/job-items";
import { jobs } from "../../../db/schema/jobs";
import { JobNotFoundError } from "../../jobs/errors/job-not-found-error";

export async function createDraftInvoice(
  binding: Env["DB"],
  user: CurrentUser,
  jobId: string,
) {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  const invoiceId = crypto.randomUUID();
  const now = Date.now();

  const [created] = await db.batch([
    db
      .insert(invoices)
      .select(
        db
          .select({
            id: sql<string>`${invoiceId}`.as("id"),
            jobId: jobs.id,
            customerId: jobs.customerId,
            invoiceNumber: sql<null>`null`.as("invoice_number"),
            status: sql<"draft">`'draft'`.as("status"),
            issuedAt: sql<null>`null`.as("issued_at"),
            voidedAt: sql<null>`null`.as("voided_at"),
            createdAt: sql<number>`${now}`.as("created_at"),
            updatedAt: sql<number>`${now}`.as("updated_at"),
          })
          .from(jobs)
          .where(eq(jobs.id, jobId)),
      )
      .returning({
        id: invoices.id,
      }),

    db.insert(invoiceItems).select(
      db
        .select({
          id: sql<string>`${invoiceId} || ':' || ${jobItems.id}`.as("id"),
          invoiceId: sql<string>`${invoiceId}`.as("invoice_id"),
          description: jobItems.description,
          amountCents: jobItems.amountCents,
          createdAt: sql<number>`${now}`.as("created_at"),
        })
        .from(jobItems)
        .where(eq(jobItems.jobId, jobId)),
    ),
  ]);

  if (!created.length) {
    throw new JobNotFoundError();
  }

  return {
    id: invoiceId,
  };
}
