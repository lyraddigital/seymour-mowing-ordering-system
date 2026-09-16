import { redirect } from "react-router";

import type { Route } from "./+types/jobs.$jobId.items.$itemId.delete";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { JobItemNotFoundError } from "../server/features/jobs/errors/job-item-not-found-error";
import { deleteJobItem } from "../server/features/jobs/services/delete-job-item.server";

export async function action({ context, params }: Route.ActionArgs) {
  const user = context.get(currentUserContext);

  if (!can(user, "jobs.manage")) {
    throw new Response("Forbidden", { status: 403 });
  }

  try {
    await deleteJobItem(
      context.get(runtimeContext).env.DB,
      user,
      params.jobId,
      params.itemId,
    );
  } catch (error) {
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
