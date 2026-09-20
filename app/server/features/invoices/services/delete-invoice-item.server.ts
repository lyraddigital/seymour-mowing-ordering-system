import { and, eq, exists, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { invoices } from "../../../db/schema/invoices";
import { InvoiceItemNotFoundError } from "../errors/invoice-item-not-found-error";
import { InvoiceNotFoundError } from "../errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../errors/invoice-state-conflict-error";

export async function deleteInvoiceItem(
  binding: Env["DB"],
  user: CurrentUser,
  invoiceId: string,
  itemId: string,
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
  const [changed] = await db.batch([
    db
      .delete(invoiceItems)
      .where(
        and(
          eq(invoiceItems.id, itemId),
          eq(invoiceItems.invoiceId, invoiceId),
          exists(
            db
              .select({ id: invoices.id })
              .from(invoices)
              .where(
                and(eq(invoices.id, invoiceId), eq(invoices.status, "draft")),
              ),
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
  if (!changed.length) {
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
    throw new InvoiceItemNotFoundError();
  }
  return changed[0];
}
