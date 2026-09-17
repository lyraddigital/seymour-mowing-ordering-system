import { and, eq } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoices } from "../../../db/schema/invoices";
import { InvoiceNotFoundError } from "../errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../errors/invoice-state-conflict-error";

export async function voidInvoice(
  binding: Env["DB"],
  user: CurrentUser,
  invoiceId: string,
) {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);
  const voidedAt = Date.now();

  const voided = await db
    .update(invoices)
    .set({
      status: "voided",
      voidedAt,
      updatedAt: voidedAt,
    })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.status, "issued")))
    .returning({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
    })
    .get();

  if (voided) {
    return {
      id: voided.id,
      invoiceNumber: voided.invoiceNumber!,
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

  throw new InvoiceStateConflictError("Only an issued invoice can be voided.");
}
