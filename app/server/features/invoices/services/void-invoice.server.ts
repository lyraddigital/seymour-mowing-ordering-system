import { and, eq, inArray, isNull } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoiceJobs } from "../../../db/schema/invoice-jobs";
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

  const [voided] = await db.batch([
    db
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
      }),

    db
      .update(invoiceJobs)
      .set({
        releasedAt: voidedAt,
      })
      .where(
        and(
          isNull(invoiceJobs.releasedAt),
          inArray(
            invoiceJobs.invoiceId,
            db
              .select({
                id: invoices.id,
              })
              .from(invoices)
              .where(
                and(
                  eq(invoices.id, invoiceId),
                  eq(invoices.status, "voided"),
                  eq(invoices.voidedAt, voidedAt),
                ),
              ),
          ),
        ),
      ),
  ]);

  if (voided.length) {
    return {
      id: voided[0].id,
      invoiceNumber: voided[0].invoiceNumber!,
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
