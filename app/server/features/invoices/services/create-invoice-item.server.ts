import { and, eq, isNull, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { invoices } from "../../../db/schema/invoices";
import { InvoiceJobSelectionError } from "../errors/invoice-job-selection-error";
import { InvoiceNotFoundError } from "../errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../errors/invoice-state-conflict-error";
import type { CreateInvoiceItemInput } from "../types/create-invoice-item-input";
import { validateCreateInvoiceItem } from "../validation/validate-create-invoice-item";

export async function createInvoiceItem(
  binding: Env["DB"],
  user: CurrentUser,
  invoiceId: string,
  input: CreateInvoiceItemInput,
) {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }
  const db = createDb(binding);
  const invoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();
  if (!invoice) {
    throw new InvoiceNotFoundError();
  }
  if (invoice.status !== "draft") {
    throw new InvoiceStateConflictError(
      "Only draft invoice items can be changed.",
    );
  }
  const values = validateCreateInvoiceItem(input);
  const id = crypto.randomUUID();
  const [created] = await db.batch([
    db
      .insert(invoiceItems)
      .select(
        db
          .select({
            id: sql<string>`${id}`.as("id"),
            invoiceId: invoices.id,
            jobId: invoiceJobs.jobId,
            description: sql<string>`${values.description}`.as("description"),
            amountCents: sql<number>`${values.amountCents}`.as("amount_cents"),
            createdAt: sql<number>`${Date.now()}`.as("created_at"),
          })
          .from(invoices)
          .innerJoin(invoiceJobs, eq(invoiceJobs.invoiceId, invoices.id))
          .where(
            and(
              eq(invoices.id, invoiceId),
              eq(invoices.status, "draft"),
              eq(invoiceJobs.jobId, values.jobId),
              isNull(invoiceJobs.releasedAt),
            ),
          ),
      )
      .returning({ id: invoiceItems.id }),
    // changes() refers to the preceding item write in this atomic batch.
    db
      .update(invoices)
      .set({ updatedAt: Date.now() })
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.status, "draft"),
          sql`changes() > 0`,
        ),
      ),
  ]);
  if (!created.length) {
    const current = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .get();
    if (!current) {
      throw new InvoiceNotFoundError();
    }
    if (current.status !== "draft") {
      throw new InvoiceStateConflictError(
        "Only draft invoice items can be changed.",
      );
    }
    throw new InvoiceJobSelectionError(
      "Choose a job currently selected on this invoice.",
    );
  }
  return created[0];
}
