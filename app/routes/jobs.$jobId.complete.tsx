import { can } from "../server/auth/authorization/policies/can";
import { data, redirect } from "react-router";
import type { Route } from "./+types/jobs.$jobId.complete";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { JobNotFoundError } from "../server/features/jobs/errors/job-not-found-error";
import { JobStateConflictError } from "../server/features/jobs/errors/job-state-conflict-error";
import { completeJob } from "../server/features/jobs/services/complete-job.server";
import { JobValidationError } from "../server/features/jobs/errors/job-validation-error";
import { getJobById } from "../server/features/jobs/queries/get-job-by-id.server";
import { listJobItems } from "../server/features/jobs/queries/list-job-items.server";
import { parseServicePrice } from "../server/features/jobs/validation/parse-service-price";

export function shouldRevalidate() {
  // The modal explicitly loads fresh billing data whenever it opens. Prevent
  // React Router from automatically reloading this review-only resource after
  // completion, when the Job is intentionally no longer completable.
  return false;
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const user = context.get(currentUserContext);
  if (!can(user, "jobs.manage"))
    throw new Response("Forbidden", { status: 403 });
  const binding = context.get(runtimeContext).env.DB;
  const job = await getJobById(binding, user, params.jobId);
  if (!job) throw new Response("Job not found", { status: 404 });
  if (job.currentStatus !== "scheduled" && job.currentStatus !== "in_progress")
    throw new Response("Only scheduled or in-progress jobs can be completed.", {
      status: 409,
    });
  const charges = await listJobItems(binding, user, job.id);
  return { job, charges };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }
  const user = context.get(currentUserContext);
  if (!can(user, "jobs.manage"))
    throw new Response("Forbidden", { status: 403 });
  const form = await request.formData();
  const returnToList = form.get("returnTo") === "list";
  const submittedPrice = form.get("servicePrice");
  const servicePrice = typeof submittedPrice === "string" ? submittedPrice : "";
  const parsed = parseServicePrice(servicePrice);
  if (!parsed.success || parsed.value === null) {
    return data(
      {
        servicePrice,
        error: parsed.success ? "Enter a service price." : parsed.error,
      },
      { status: 400 },
    );
  }
  try {
    await completeJob(
      context.get(runtimeContext).env.DB,
      user,
      params.jobId,
      parsed.value,
    );
  } catch (error) {
    if (error instanceof JobValidationError)
      return data(
        { servicePrice, error: error.fieldErrors.servicePriceCents },
        { status: 400 },
      );
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
