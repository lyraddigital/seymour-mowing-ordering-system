import { data, redirect } from "react-router";
import type { Route } from "./+types/jobs.new";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { can } from "../server/auth/authorization/policies/can";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { listActiveCustomers } from "../server/features/customers/queries/list-active-customers.server";
import { createJob } from "../server/features/jobs/services/create-job.server";
import { JobValidationError } from "../server/features/jobs/errors/job-validation-error";
import NewJobPage from "../ui/features/jobs/pages/new-job-page/new-job-page";

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(currentUserContext);
  if (!can(user, "jobs.manage"))
    throw new Response("Forbidden", { status: 403 });
  try {
    return {
      customers: await listActiveCustomers(
        context.get(runtimeContext).env.DB,
        user,
      ),
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError)
      throw new Response("Forbidden", { status: 403 });
    throw error;
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = context.get(currentUserContext);
  if (!can(user, "jobs.manage"))
    throw new Response("Forbidden", { status: 403 });
  const form = await request.formData();
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };
  const values = {
    name: text("name"),
    customerId: text("customerId"),
    scheduledDate: text("scheduledDate"),
    description: text("description"),
  };
  try {
    await createJob(context.get(runtimeContext).env.DB, user, values);
  } catch (error) {
    if (error instanceof JobValidationError)
      return data({ values, fieldErrors: error.fieldErrors }, { status: 400 });
    if (error instanceof PermissionDeniedError)
      throw new Response("Forbidden", { status: 403 });
    throw error;
  }
  return redirect("/jobs");
}

export default function NewJobRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <NewJobPage
      customers={loaderData.customers}
      values={actionData?.values}
      fieldErrors={actionData?.fieldErrors}
    />
  );
}
