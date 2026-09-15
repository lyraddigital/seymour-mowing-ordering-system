import type { Route } from "./+types/jobs.history";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { listJobHistory } from "../server/features/jobs/queries/list-job-history.server";
import JobHistoryPage from "../ui/features/jobs/pages/job-history-page/job-history-page";

export async function loader({ context }: Route.LoaderArgs) {
  try {
    return {
      jobs: await listJobHistory(
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

export default function JobHistoryRoute({ loaderData }: Route.ComponentProps) {
  return <JobHistoryPage jobs={loaderData.jobs} />;
}
