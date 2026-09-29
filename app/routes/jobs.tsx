import type { Route } from "./+types/jobs";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { isJobStatus } from "../server/features/jobs/job-status";
import { listJobsByStatus } from "../server/features/jobs/queries/list-jobs-by-status.server";
import JobsPage from "../ui/features/jobs/pages/jobs-page/jobs-page";

export async function loader({ context, request }: Route.LoaderArgs) {
  try {
    const requestedStatus = new URL(request.url).searchParams.get("status");
    const status = isJobStatus(requestedStatus) ? requestedStatus : "scheduled";

    return {
      canManage: can(context.get(currentUserContext), "jobs.manage"),
      jobs: await listJobsByStatus(
        context.get(runtimeContext).env.DB,
        context.get(currentUserContext),
        status,
      ),
      status,
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError)
      throw new Response("Forbidden", { status: 403 });
    throw error;
  }
}

export default function JobsRoute({ loaderData }: Route.ComponentProps) {
  return (
    <JobsPage
      jobs={loaderData.jobs}
      status={loaderData.status}
      canManage={loaderData.canManage}
    />
  );
}
