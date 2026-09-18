import { data, redirect } from "react-router";

import type { Route } from "./+types/invoices.new";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { InvoiceJobConflictError } from "../server/features/invoices/errors/invoice-job-conflict-error";
import { InvoiceJobSelectionError } from "../server/features/invoices/errors/invoice-job-selection-error";
import { listInvoiceableJobs } from "../server/features/invoices/queries/list-invoiceable-jobs.server";
import { createDraftInvoice } from "../server/features/invoices/services/create-draft-invoice.server";
import NewInvoicePage from "../ui/features/invoices/pages/new-invoice-page/new-invoice-page";

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = context.get(currentUserContext);

  try {
    const jobs = await listInvoiceableJobs(
      context.get(runtimeContext).env.DB,
      user,
    );

    const requestedJobId = new URL(request.url).searchParams.get("jobId");

    const initialJobId =
      requestedJobId && jobs.some((job) => job.id === requestedJobId)
        ? requestedJobId
        : null;

    return {
      jobs,
      initialJobId,
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

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();

  const jobIds = form
    .getAll("jobId")
    .filter((value): value is string => typeof value === "string");

  try {
    const result = await createDraftInvoice(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      {
        jobIds,
      },
    );

    return redirect(`/invoices/${result.id}`);
  } catch (error) {
    if (
      error instanceof InvoiceJobSelectionError ||
      error instanceof InvoiceJobConflictError
    ) {
      return data(
        {
          values: {
            jobIds,
          },
          errorMessage: error.message,
        },
        {
          status: 400,
        },
      );
    }

    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", {
        status: 403,
      });
    }

    throw error;
  }
}

export default function NewInvoiceRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <NewInvoicePage
      jobs={loaderData.jobs}
      initialJobId={loaderData.initialJobId}
      values={actionData?.values}
      errorMessage={actionData?.errorMessage}
    />
  );
}
