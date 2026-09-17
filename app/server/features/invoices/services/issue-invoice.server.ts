import { and, eq, sql } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { invoices } from "../../../db/schema/invoices";
import { InvoiceNotFoundError } from "../errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../errors/invoice-state-conflict-error";

const invoiceNumberPrefix = "INV-";
const invoiceNumberDigits = 6;

function formatInvoiceNumber(value: number) {
  return `${invoiceNumberPrefix}${String(value).padStart(
    invoiceNumberDigits,
    "0",
  )}`;
}

function isInvoiceNumberConflict(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("UNIQUE constraint failed: invoices.invoice_number")
  );
}

export async function issueInvoice(
  binding: Env["DB"],
  user: CurrentUser,
  invoiceId: string,
) {
  if (!can(user, "invoices.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);

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

  if (invoice.status !== "draft") {
    throw new InvoiceStateConflictError("Only a draft invoice can be issued.");
  }

  for (;;) {
    const numberResult = await db
      .select({
        highestNumber: sql<number>`
          coalesce(
            max(
              cast(
                substr(${invoices.invoiceNumber}, 5)
                as integer
              )
            ),
            0
          )
        `,
      })
      .from(invoices)
      .get();

    const invoiceNumber = formatInvoiceNumber(
      (numberResult?.highestNumber ?? 0) + 1,
    );

    const issuedAt = Date.now();

    try {
      const issued = await db
        .update(invoices)
        .set({
          invoiceNumber,
          status: "issued",
          issuedAt,
          updatedAt: issuedAt,
        })
        .where(
          and(
            eq(invoices.id, invoiceId),
            eq(invoices.status, "draft"),
            sql`${invoices.invoiceNumber} is null`,
          ),
        )
        .returning({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
        })
        .get();

      if (!issued) {
        const current = await db
          .select({
            id: invoices.id,
            status: invoices.status,
          })
          .from(invoices)
          .where(eq(invoices.id, invoiceId))
          .get();

        if (!current) {
          throw new InvoiceNotFoundError();
        }

        throw new InvoiceStateConflictError(
          "Only a draft invoice can be issued.",
        );
      }

      return {
        id: issued.id,
        invoiceNumber: issued.invoiceNumber!,
      };
    } catch (error) {
      if (isInvoiceNumberConflict(error)) {
        continue;
      }

      throw error;
    }
  }
}
