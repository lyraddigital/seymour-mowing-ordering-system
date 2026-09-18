import { redirect } from "react-router";

import type { Route } from "./+types/invoices.$invoiceId.issue";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { InvoiceNotFoundError } from "../server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../server/features/invoices/errors/invoice-state-conflict-error";
import { issueInvoice } from "../server/features/invoices/services/issue-invoice.server";

export async function action({ context, params }: Route.ActionArgs) {
  try {
    await issueInvoice(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      params.invoiceId,
    );

    return redirect(`/invoices/${params.invoiceId}`);
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
