import { data, redirect } from "react-router";

import type { Route } from "./+types/invoices.$invoiceId.payments.new";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { InvoiceNotFoundError } from "../server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../server/features/invoices/errors/invoice-state-conflict-error";
import { getInvoiceById } from "../server/features/invoices/queries/get-invoice-by-id.server";
import { PaymentOverpaymentError } from "../server/features/payments/errors/payment-overpayment-error";
import { PaymentValidationError } from "../server/features/payments/errors/payment-validation-error";
import { recordPayment } from "../server/features/payments/services/record-payment.server";
import RecordPaymentPage from "../ui/features/invoices/pages/record-payment-page/record-payment-page";

function parseAmountCents(value: string) {
  const trimmed = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return Number.NaN;
  }

  const [dollars, cents = ""] = trimmed.split(".");

  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
}

function getMelbourneDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const part = (name: string) =>
    parts.find((entry) => entry.type === name)?.value;

  const year = part("year");
  const month = part("month");
  const day = part("day");

  if (!year || !month || !day) {
    throw new Error("Could not determine Melbourne calendar date.");
  }

  return `${year}-${month}-${day}`;
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const user = context.get(currentUserContext);

  if (!can(user, "invoices.manage")) {
    throw new Response("Forbidden", { status: 403 });
  }

  try {
    const result = await getInvoiceById(
      context.get(runtimeContext).env.DB,
      user,
      params.invoiceId,
    );

    if (!result) {
      throw new Response("Invoice not found", { status: 404 });
    }

    if (result.invoice.status !== "issued") {
      throw new Response(
        "Payments can only be recorded against issued invoices",
        { status: 409 },
      );
    }

    if (result.invoice.balanceCents <= 0) {
      throw new Response("This invoice is already fully paid", { status: 409 });
    }

    return {
      invoice: result.invoice,
      defaultPaymentDate: getMelbourneDate(),
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    throw error;
  }
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = context.get(currentUserContext);

  if (!can(user, "invoices.manage")) {
    throw new Response("Forbidden", { status: 403 });
  }

  const form = await request.formData();

  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };

  const values = {
    paymentDate: text("paymentDate"),
    amount: text("amount"),
  };

  try {
    await recordPayment(
      context.get(runtimeContext).env.DB,
      user,
      params.invoiceId,
      {
        amountCents: parseAmountCents(values.amount),
        paymentDate: values.paymentDate,
      },
    );
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return data(
        {
          values,
          fieldErrors: error.fieldErrors,
        },
        { status: 400 },
      );
    }

    if (error instanceof PaymentOverpaymentError) {
      return data(
        {
          values,
          fieldErrors: {
            amount: error.message,
          },
        },
        { status: 400 },
      );
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

export default function RecordPaymentRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <RecordPaymentPage
      invoice={loaderData.invoice}
      defaultPaymentDate={loaderData.defaultPaymentDate}
      values={actionData?.values}
      fieldErrors={actionData?.fieldErrors}
    />
  );
}
