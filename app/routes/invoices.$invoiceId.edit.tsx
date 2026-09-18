import { data, redirect } from "react-router";

import type { Route } from "./+types/invoices.$invoiceId.edit";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { InvoiceJobConflictError } from "../server/features/invoices/errors/invoice-job-conflict-error";
import { InvoiceJobSelectionError } from "../server/features/invoices/errors/invoice-job-selection-error";
import { InvoiceNotFoundError } from "../server/features/invoices/errors/invoice-not-found-error";
import { InvoiceStateConflictError } from "../server/features/invoices/errors/invoice-state-conflict-error";
import { getInvoiceById } from "../server/features/invoices/queries/get-invoice-by-id.server";
import { listInvoiceableJobs } from "../server/features/invoices/queries/list-invoiceable-jobs.server";
import { updateDraftInvoiceJobs } from "../server/features/invoices/services/update-draft-invoice-jobs.server";
import EditInvoicePage from "../ui/features/invoices/pages/edit-invoice-page/edit-invoice-page";

export async function loader({ context, params }: Route.LoaderArgs) {
  try {
    const binding = context.get(runtimeContext).env.DB;

    const user = context.get(currentUserContext);

    const invoiceResult = await getInvoiceById(binding, user, params.invoiceId);

    if (!invoiceResult) {
      throw new Response("Invoice not found", {
        status: 404,
      });
    }

    if (invoiceResult.invoice.status !== "draft") {
      throw new Response("Only draft invoices can be edited", {
        status: 409,
      });
    }

    const availableJobs = await listInvoiceableJobs(binding, user);

    const jobsById = new Map<
      string,
      {
        id: string;
        name: string;
        scheduledDate: string;
      }
    >();

    for (const job of invoiceResult.invoice.jobs) {
      jobsById.set(job.id, {
        id: job.id,
        name: job.name,
        scheduledDate: job.scheduledDate,
      });
    }

    for (const job of availableJobs) {
      if (job.customerId === invoiceResult.invoice.customerId) {
        jobsById.set(job.id, {
          id: job.id,
          name: job.name,
          scheduledDate: job.scheduledDate,
        });
      }
    }

    const jobs = [...jobsById.values()].sort(
      (left, right) =>
        left.scheduledDate.localeCompare(right.scheduledDate) ||
        left.id.localeCompare(right.id),
    );

    return {
      invoiceId: invoiceResult.invoice.id,
      customerName: invoiceResult.invoice.customerName,
      jobs,
      selectedJobIds: invoiceResult.invoice.jobs.map((job) => job.id),
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

  const jobIds = form
    .getAll("jobId")
    .filter((value): value is string => typeof value === "string");

  try {
    await updateDraftInvoiceJobs(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      params.invoiceId,
      {
        jobIds,
      },
    );

    return redirect(`/invoices/${params.invoiceId}`);
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

export default function EditInvoiceRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <EditInvoicePage
      invoiceId={loaderData.invoiceId}
      customerName={loaderData.customerName}
      jobs={loaderData.jobs}
      selectedJobIds={actionData?.values.jobIds ?? loaderData.selectedJobIds}
      errorMessage={actionData?.errorMessage}
    />
  );
}
