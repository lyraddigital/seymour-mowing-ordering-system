import { can } from "../server/auth/authorization/policies/can";
import { redirect } from "react-router";
import type { Route } from "./+types/jobs.$jobId.complete";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { JobNotFoundError } from "../server/features/jobs/errors/job-not-found-error";
import { JobStateConflictError } from "../server/features/jobs/errors/job-state-conflict-error";
import { completeJob } from "../server/features/jobs/services/complete-job.server";

export async function action({ request, context, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }
  const user = context.get(currentUserContext);
  if (!can(user, "jobs.manage")) throw new Response("Forbidden", { status: 403 });
  const form = await request.formData();
  const returnToList = form.get("returnTo") === "list";
  try {
    await completeJob(
      context.get(runtimeContext).env.DB,
      user,
      params.jobId,
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError)
      throw new Response("Forbidden", { status: 403 });
    if (error instanceof JobNotFoundError)
      throw new Response("Job not found", { status: 404 });
    if (error instanceof JobStateConflictError)
      throw new Response(error.message, { status: 409 });
    throw error;
  }
  return redirect(returnToList ? "/jobs" : `/jobs/${params.jobId}`);
}

