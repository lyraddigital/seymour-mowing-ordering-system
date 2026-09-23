import { data, redirect } from "react-router";

import type { Route } from "./+types/invoices.$invoiceId.issue";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { InvoiceNotFoundError } from "../server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../server/features/invoices/errors/invoice-state-conflict-error";
import { IssueInvoiceValidationError } from "../server/features/invoices/errors/issue-invoice-validation-error";
import { getInvoiceById } from "../server/features/invoices/queries/get-invoice-by-id.server";
import { issueInvoice } from "../server/features/invoices/services/issue-invoice.server";
import IssueInvoicePage from "../ui/features/invoices/pages/issue-invoice-page/issue-invoice-page";

export async function loader({ context, params }: Route.LoaderArgs) {
  const user = context.get(currentUserContext);

  if (!can(user, "invoices.manage")) {
    throw new Response("Forbidden", {
      status: 403,
    });
  }

  try {
    const result = await getInvoiceById(
      context.get(runtimeContext).env.DB,
      user,
      params.invoiceId,
    );

    if (!result) {
      throw new Response("Invoice not found", {
        status: 404,
      });
    }

    if (result.invoice.status !== "draft") {
      throw new Response("Only a draft invoice can be issued.", {
        status: 409,
      });
    }

    return {
      invoice: result.invoice,
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", {
        status: 403,
      });
    }

    throw error;
  }
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const form = await request.formData();

  const value = form.get("dueDate");
  const dueDate = typeof value === "string" ? value : "";

  try {
    await issueInvoice(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      params.invoiceId,
      {
        dueDate,
      },
    );

    return redirect(`/invoices/${params.invoiceId}`);
  } catch (error) {
    if (error instanceof IssueInvoiceValidationError) {
      return data(
        {
          values: {
            dueDate,
          },
          fieldErrors: error.fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

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

export default function IssueInvoiceRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <IssueInvoicePage
      invoice={loaderData.invoice}
      values={actionData?.values}
      fieldErrors={actionData?.fieldErrors}
    />
  );
}
