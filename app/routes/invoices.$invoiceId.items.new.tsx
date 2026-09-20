import { data, redirect } from "react-router";

import type { Route } from "./+types/invoices.$invoiceId.items.new";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { InvoiceItemValidationError } from "../server/features/invoices/errors/invoice-item-validation-error";
import { InvoiceJobSelectionError } from "../server/features/invoices/errors/invoice-job-selection-error";
import { InvoiceNotFoundError } from "../server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../server/features/invoices/errors/invoice-state-conflict-error";
import { getInvoiceById } from "../server/features/invoices/queries/get-invoice-by-id.server";
import { createInvoiceItem } from "../server/features/invoices/services/create-invoice-item.server";
import AddInvoiceItemPage from "../ui/features/invoices/pages/add-invoice-item-page/add-invoice-item-page";

function parseAmountCents(value: string) {
  const trimmed = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return Number.NaN;
  }

  const [dollars, cents = ""] = trimmed.split(".");

  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
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
    if (result.invoice.status !== "draft") {
      throw new Response("Only draft invoice items can be changed", {
        status: 409,
      });
    }
    return { invoice: result.invoice };
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
    jobId: text("jobId"),
    description: text("description"),
    amount: text("amount"),
  };

  try {
    await createInvoiceItem(
      context.get(runtimeContext).env.DB,
      user,
      params.invoiceId,
      {
        jobId: values.jobId,
        description: values.description,
        amountCents: parseAmountCents(values.amount),
      },
    );
  } catch (error) {
    if (error instanceof InvoiceJobSelectionError) {
      return data(
        { values, fieldErrors: { jobId: error.message } },
        { status: 400 },
      );
    }
    if (error instanceof InvoiceItemValidationError) {
      return data(
        {
          values,
          fieldErrors: error.fieldErrors,
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

export default function AddInvoiceItemRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <AddInvoiceItemPage
      invoice={loaderData.invoice}
      values={actionData?.values}
      fieldErrors={actionData?.fieldErrors}
    />
  );
}
