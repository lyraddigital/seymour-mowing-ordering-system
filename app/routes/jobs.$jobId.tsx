import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { getActiveInvoiceForJob } from "../server/features/invoices/queries/get-active-invoice-for-job.server";
import { isJobInvoiceable } from "../server/features/invoices/queries/is-job-invoiceable.server";
import { getJobById } from "../server/features/jobs/queries/get-job-by-id.server";
import { listJobItems } from "../server/features/jobs/queries/list-job-items.server";
import JobPage from "../ui/features/jobs/pages/job-page/job-page";
import type { Route } from "./+types/jobs.$jobId";

export async function loader({ context, params }: Route.LoaderArgs) {
  try {
    const binding = context.get(runtimeContext).env.DB;
    const user = context.get(currentUserContext);

    const [job, jobItems] = await Promise.all([
      getJobById(binding, user, params.jobId),
      listJobItems(binding, user, params.jobId),
    ]);

    if (!job) {
      throw new Response("Job not found", {
        status: 404,
      });
    }

    const canReadInvoices = can(user, "invoices.read");
    const canManageInvoices = can(user, "invoices.manage");

    const [invoice, invoiceable] = await Promise.all([
      canReadInvoices
        ? getActiveInvoiceForJob(binding, user, job.id)
        : Promise.resolve(null),

      canManageInvoices
        ? isJobInvoiceable(binding, user, job.id)
        : Promise.resolve(false),
    ]);

    return {
      job,
      jobItems: jobItems.items,
      jobTotalCents: jobItems.totalCents,
      invoice,
      canManage: can(user, "jobs.manage"),
      canCreateInvoice: canManageInvoices && invoiceable,
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

export default function JobRoute({ loaderData }: Route.ComponentProps) {
  return (
    <JobPage
      job={loaderData.job}
      jobItems={loaderData.jobItems}
      jobTotalCents={loaderData.jobTotalCents}
      invoice={loaderData.invoice}
      canManage={loaderData.canManage}
      canCreateInvoice={loaderData.canCreateInvoice}
    />
  );
}
