import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { data, redirect } from "react-router";
import type { Route } from "./+types/customers.new";
import { can } from "../server/auth/authorization/policies/can";
import { createCustomer } from "../server/features/customers/services/create-customer.server";
import { CustomerValidationError } from "../server/features/customers/errors/customer-validation-error";
import NewCustomerPage from "../ui/features/customers/pages/new-customer-page/new-customer-page";

export function loader({ context }: Route.LoaderArgs) {
  if (!can(context.get(currentUserContext), "customers.manage")) {
    throw new Response("Forbidden", { status: 403 });
  }
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };
  const values = {
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    addressLine1: text("addressLine1"),
    addressLine2: text("addressLine2"),
    suburb: text("suburb"),
    state: text("state"),
    postcode: text("postcode"),
    notes: text("notes"),
  };
  try {
    await createCustomer(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      values,
    );
  } catch (error) {
    if (error instanceof CustomerValidationError) {
      return data({ values, fieldErrors: error.fieldErrors }, { status: 400 });
    }
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }
    throw error;
  }
  return redirect("/customers");
}

export default function NewCustomerRoute({ actionData }: Route.ComponentProps) {
  return (
    <NewCustomerPage
      values={actionData?.values}
      fieldErrors={actionData?.fieldErrors}
    />
  );
}
