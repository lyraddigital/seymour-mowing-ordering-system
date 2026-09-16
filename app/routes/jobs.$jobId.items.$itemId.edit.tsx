import { data, redirect } from "react-router";

import type { Route } from "./+types/jobs.$jobId.items.$itemId.edit";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { JobItemNotFoundError } from "../server/features/jobs/errors/job-item-not-found-error";
import { JobItemValidationError } from "../server/features/jobs/errors/job-item-validation-error";
import { getJobById } from "../server/features/jobs/queries/get-job-by-id.server";
import { getJobItemById } from "../server/features/jobs/queries/get-job-item-by-id.server";
import { updateJobItem } from "../server/features/jobs/services/update-job-item.server";
import EditJobItemPage from "../ui/features/jobs/pages/edit-job-item-page/edit-job-item-page";

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
    const binding = context.get(runtimeContext).env.DB;

    const [job, item] = await Promise.all([
      getJobById(binding, user, params.jobId),
      getJobItemById(binding, user, params.jobId, params.itemId),
    ]);

    if (!job) {
      throw new Response("Job not found", { status: 404 });
    }

    if (!item) {
      throw new Response("Job item not found", { status: 404 });
    }

    return {
      job,
      item,
    };
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
    await updateJobItem(
      context.get(runtimeContext).env.DB,
      user,
      params.jobId,
      params.itemId,
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

    if (error instanceof JobItemNotFoundError) {
      throw new Response("Job item not found", {
        status: 404,
      });
    }

    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    throw error;
  }

  return redirect(`/jobs/${params.jobId}`);
}

export default function EditJobItemRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <EditJobItemPage
      job={loaderData.job}
      item={loaderData.item}
      values={actionData?.values}
      fieldErrors={actionData?.fieldErrors}
    />
  );
}
