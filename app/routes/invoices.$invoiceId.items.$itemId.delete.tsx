import { redirect } from "react-router";

import type { Route } from "./+types/invoices.$invoiceId.items.$itemId.delete";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { InvoiceItemNotFoundError } from "../server/features/invoices/errors/invoice-item-not-found-error";
import { InvoiceNotFoundError } from "../server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../server/features/invoices/errors/invoice-state-conflict-error";
import { deleteInvoiceItem } from "../server/features/invoices/services/delete-invoice-item.server";

export async function action({ context, params }: Route.ActionArgs) {
  const user = context.get(currentUserContext);

  if (!can(user, "invoices.manage")) {
    throw new Response("Forbidden", { status: 403 });
  }

  try {
    await deleteInvoiceItem(
      context.get(runtimeContext).env.DB,
      user,
      params.invoiceId,
      params.itemId,
    );
  } catch (error) {
    if (error instanceof InvoiceItemNotFoundError) {
      throw new Response("Invoice item not found", {
        status: 404,
      });
    }

    if (error instanceof InvoiceNotFoundError) {
      throw new Response("Invoice not found", { status: 404 });
    }
    if (error instanceof InvoiceStateConflictError) {
      throw new Response(error.message, { status: 409 });
    }
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    throw error;
  }

  return redirect(`/invoices/${params.invoiceId}`);
}
