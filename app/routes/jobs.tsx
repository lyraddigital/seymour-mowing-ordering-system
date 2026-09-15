import type { Route } from "./+types/jobs";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { listActiveJobs } from "../server/features/jobs/queries/list-active-jobs.server";
import JobsPage from "../ui/features/jobs/pages/jobs-page/jobs-page";

export async function loader({ context }: Route.LoaderArgs) {
  try {
    return {
      jobs: await listActiveJobs(
        context.get(runtimeContext).env.DB,
        context.get(currentUserContext),
      ),
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError)
      throw new Response("Forbidden", { status: 403 });
    throw error;
  }
}

export default function JobsRoute({ loaderData }: Route.ComponentProps) {
  return <JobsPage jobs={loaderData.jobs} />;
}
