import { CustomerStateConflictError } from "../server/features/customers/errors/customer-state-conflict-error";
import { getCustomerById } from "../server/features/customers/queries/get-customer-by-id.server";
import { CustomerNotFoundError } from "../server/features/customers/errors/customer-not-found-error";
import type { UpdateCustomerInput } from "../server/features/customers/types/update-customer-input";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { data, redirect } from "react-router";
import type { Route } from "./+types/customers.$customerId.edit";
import { can } from "../server/auth/authorization/policies/can";
import { updateCustomer } from "../server/features/customers/services/update-customer.server";
import { CustomerValidationError } from "../server/features/customers/errors/customer-validation-error";
import EditCustomerPage from "../ui/features/customers/pages/edit-customer-page/edit-customer-page";

export async function loader({ context, params }: Route.LoaderArgs) {
  if (!can(context.get(currentUserContext), "customers.manage")) {
    throw new Response("Forbidden", { status: 403 });
  }
  try {
    const customer = await getCustomerById(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      params.customerId,
    );
    if (!customer) {
      throw new Response("Customer not found", { status: 404 });
    }
    if (customer.archivedAt !== null) {
      throw redirect(`/customers/${params.customerId}`);
    }
    return { customer };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }
    throw error;
  }
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const form = await request.formData();
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };
  const values: UpdateCustomerInput = {
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
    await updateCustomer(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      params.customerId,
      values,
    );
  } catch (error) {
    if (error instanceof CustomerStateConflictError) {
      throw new Response(error.message, { status: 409 });
    }
    if (error instanceof CustomerNotFoundError) {
      throw new Response("Customer not found", { status: 404 });
    }
    if (error instanceof CustomerValidationError) {
      return data({ values, fieldErrors: error.fieldErrors }, { status: 400 });
    }
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }
    throw error;
  }
  return redirect(`/customers/${params.customerId}`);
}

export default function EditCustomerRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  return (
    <EditCustomerPage
      customer={loaderData.customer}
      values={actionData?.values}
      fieldErrors={actionData?.fieldErrors}
    />
  );
}
