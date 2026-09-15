import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { getJobById } from "../server/features/jobs/queries/get-job-by-id.server";
import JobPage from "../ui/features/jobs/pages/job-page/job-page";
import type { Route } from "./+types/jobs.$jobId";

export async function loader({ context, params }: Route.LoaderArgs) {
  try {
    const job = await getJobById(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      params.jobId,
    );
    if (!job) throw new Response("Job not found", { status: 404 });
    return { job };
  } catch (error) {
    if (error instanceof PermissionDeniedError)
      throw new Response("Forbidden", { status: 403 });
    throw error;
  }
}

export default function JobRoute({ loaderData }: Route.ComponentProps) {
  return <JobPage job={loaderData.job} />;
}
