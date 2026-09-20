import { redirect } from "react-router";

import type { Route } from "./+types/invoices.$invoiceId.payments.$paymentId.void";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PaymentNotFoundError } from "../server/features/payments/errors/payment-not-found-error";
import { InvoiceNotFoundError } from "../server/features/invoices/errors/invoice-not-found-error";
import { PaymentStateConflictError } from "../server/features/payments/errors/payment-state-conflict-error";
import { voidPayment } from "../server/features/payments/services/void-payment.server";

export async function action({ context, params }: Route.ActionArgs) {
  const user = context.get(currentUserContext);

  if (!can(user, "invoices.manage")) {
    throw new Response("Forbidden", { status: 403 });
  }

  try {
    await voidPayment(
      context.get(runtimeContext).env.DB,
      user,
      params.invoiceId,
      params.paymentId,
    );
  } catch (error) {
    if (error instanceof PaymentNotFoundError) {
      throw new Response("Payment not found", {
        status: 404,
      });
    }

    if (error instanceof InvoiceNotFoundError) {
      throw new Response("Invoice not found", { status: 404 });
    }
    if (error instanceof PaymentStateConflictError) {
      throw new Response(error.message, { status: 409 });
    }
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    throw error;
  }

  return redirect(`/invoices/${params.invoiceId}`);
}
