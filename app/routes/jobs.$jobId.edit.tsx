import { data, redirect } from "react-router";

import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { JobNotFoundError } from "../server/features/jobs/errors/job-not-found-error";
import { JobStateConflictError } from "../server/features/jobs/errors/job-state-conflict-error";
import { JobValidationError } from "../server/features/jobs/errors/job-validation-error";
import { getJobById } from "../server/features/jobs/queries/get-job-by-id.server";
import { updateJob } from "../server/features/jobs/services/update-job.server";
import type { UpdateJobInput } from "../server/features/jobs/types/update-job-input";
import EditJobPage from "../ui/features/jobs/pages/edit-job-page/edit-job-page";
import type { Route } from "./+types/jobs.$jobId.edit";

export async function loader({ context, params }: Route.LoaderArgs) {
  const user = context.get(currentUserContext);

  if (!can(user, "jobs.manage")) {
    throw new Response("Forbidden", { status: 403 });
  }

  try {
    const job = await getJobById(
      context.get(runtimeContext).env.DB,
      user,
      params.jobId,
    );

    if (!job) {
      throw new Response("Job not found", { status: 404 });
    }

    return { job };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    throw error;
  }
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = context.get(currentUserContext);

  if (!can(user, "jobs.manage")) {
    throw new Response("Forbidden", { status: 403 });
  }

  const form = await request.formData();

  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };

  const values: UpdateJobInput = {
    name: text("name"),
    scheduledDate: text("scheduledDate"),
    description: text("description"),
  };

  try {
    await updateJob(
      context.get(runtimeContext).env.DB,
      user,
      params.jobId,
      values,
    );
  } catch (error) {
    if (error instanceof JobValidationError) {
      return data(
        {
          values,
          fieldErrors: error.fieldErrors,
        },
        { status: 400 },
      );
    }

    if (error instanceof JobNotFoundError) {
      throw new Response("Job not found", { status: 404 });
    }

    if (error instanceof JobStateConflictError) {
      throw new Response(error.message, { status: 409 });
    }

    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    throw error;
  }

  return redirect(`/jobs/${params.jobId}`);
}

export default function EditJobRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <EditJobPage
      job={loaderData.job}
      values={actionData?.values}
      fieldErrors={actionData?.fieldErrors}
    />
  );
}
