import { redirect } from "react-router";

import type { Route } from "./+types/invoices.$invoiceId.delete";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { InvoiceNotFoundError } from "../server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../server/features/invoices/errors/invoice-state-conflict-error";
import { deleteDraftInvoice } from "../server/features/invoices/services/delete-draft-invoice.server";

export async function action({ context, params }: Route.ActionArgs) {
  try {
    await deleteDraftInvoice(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      params.invoiceId,
    );

    return redirect("/invoices");
  } catch (error) {
    if (error instanceof InvoiceNotFoundError) {
      throw new Response("Invoice not found", {
        status: 404,
      });
    }

    if (error instanceof InvoiceStateConflictError) {
      throw new Response(error.message, {
        status: 409,
      });
    }

    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", {
        status: 403,
      });
    }

    throw error;
  }
}
