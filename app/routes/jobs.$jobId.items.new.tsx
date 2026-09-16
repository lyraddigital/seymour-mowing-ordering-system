import { data, redirect } from "react-router";

import type { Route } from "./+types/jobs.$jobId.items.new";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { JobItemValidationError } from "../server/features/jobs/errors/job-item-validation-error";
import { JobNotFoundError } from "../server/features/jobs/errors/job-not-found-error";
import { getJobById } from "../server/features/jobs/queries/get-job-by-id.server";
import { createJobItem } from "../server/features/jobs/services/create-job-item.server";
import AddJobItemPage from "../ui/features/jobs/pages/add-job-item-page/add-job-item-page";

function parseAmountCents(value: string) {
  const trimmed = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return Number.NaN;
  }

  const [dollars, cents = ""] = trimmed.split(".");

  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
}

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

  const values = {
    description: text("description"),
    amount: text("amount"),
  };

  try {
    await createJobItem(
      context.get(runtimeContext).env.DB,
      user,
      params.jobId,
      {
        description: values.description,
        amountCents: parseAmountCents(values.amount),
      },
    );
  } catch (error) {
    if (error instanceof JobItemValidationError) {
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

    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    throw error;
  }

  return redirect(`/jobs/${params.jobId}`);
}

export default function AddJobItemRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <AddJobItemPage
      job={loaderData.job}
      values={actionData?.values}
      fieldErrors={actionData?.fieldErrors}
    />
  );
}
