import { redirect } from "react-router";

import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { JobNotFoundError } from "../server/features/jobs/errors/job-not-found-error";
import { JobStateConflictError } from "../server/features/jobs/errors/job-state-conflict-error";
import { reopenJob } from "../server/features/jobs/services/reopen-job.server";
import type { Route } from "./+types/jobs.$jobId.reopen";

export async function action({ request, context, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  const user = context.get(currentUserContext);

  if (!can(user, "jobs.manage")) {
    throw new Response("Forbidden", { status: 403 });
  }

  try {
    await reopenJob(context.get(runtimeContext).env.DB, user, params.jobId);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    if (error instanceof JobNotFoundError) {
      throw new Response("Job not found", { status: 404 });
    }

    if (error instanceof JobStateConflictError) {
      throw new Response(error.message, { status: 409 });
    }

    throw error;
  }

  return redirect(`/jobs/${params.jobId}`);
}
