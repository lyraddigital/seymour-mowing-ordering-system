import { and, eq, inArray } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
import { invoices } from "../../../db/schema/invoices";
import { InvoiceNotFoundError } from "../errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../errors/invoice-state-conflict-error";

export async function deleteDraftInvoice(
  binding: Env["DB"],
  user: CurrentUser,
  invoiceId: string,
) {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

  const draftInvoiceIds = db
    .select({
      id: invoices.id,
    })
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.status, "draft")));

  const [, , deletedInvoices] = await db.batch([
    db
      .delete(invoiceItems)
      .where(inArray(invoiceItems.invoiceId, draftInvoiceIds)),

    db
      .delete(invoiceJobs)
      .where(inArray(invoiceJobs.invoiceId, draftInvoiceIds)),

    db
      .delete(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.status, "draft")))
      .returning({
        id: invoices.id,
      }),
  ]);

  if (deletedInvoices.length) {
    return {
      id: deletedInvoices[0].id,
    };
  }

  const invoice = await db
    .select({
      id: invoices.id,
      status: invoices.status,
    })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();

  if (!invoice) {
    throw new InvoiceNotFoundError();
  }

  throw new InvoiceStateConflictError("Only a draft invoice can be deleted.");
}
