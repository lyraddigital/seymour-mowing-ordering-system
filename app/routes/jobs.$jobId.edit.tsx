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
import type {
  EditJobFormFieldErrors,
  EditJobFormValues,
} from "../server/features/jobs/types/edit-job-form-values";
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

    if (
      job.currentStatus !== "scheduled" &&
      job.currentStatus !== "in_progress"
    ) {
      throw new Response("Only scheduled or in-progress jobs can be edited.", {
        status: 409,
      });
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

  const values: EditJobFormValues = {
    name: text("name"),
    scheduledDate: text("scheduledDate"),
    description: text("description"),
  };

  const input: UpdateJobInput = {
    name: values.name,
    scheduledDate: values.scheduledDate,
    description: values.description,
  };

  try {
    await updateJob(
      context.get(runtimeContext).env.DB,
      user,
      params.jobId,
      input,
    );
  } catch (error) {
    if (error instanceof JobValidationError) {
      const fieldErrors: EditJobFormFieldErrors = {
        name: error.fieldErrors.name,
        scheduledDate: error.fieldErrors.scheduledDate,
        description: error.fieldErrors.description,
      };

      return data(
        {
          values,
          fieldErrors,
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
