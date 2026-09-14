import { redirect } from "react-router";
import type { Route } from "./+types/customers.$customerId.archive";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { CustomerNotFoundError } from "../server/features/customers/errors/customer-not-found-error";
import { CustomerStateConflictError } from "../server/features/customers/errors/customer-state-conflict-error";
import { archiveCustomer } from "../server/features/customers/services/archive-customer.server";

export async function action({ request, context, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  try {
    await archiveCustomer(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      params.customerId,
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }
    if (error instanceof CustomerNotFoundError) {
      throw new Response("Customer not found", { status: 404 });
    }
    if (error instanceof CustomerStateConflictError) {
      throw new Response(error.message, { status: 409 });
    }
    throw error;
  }

  return redirect("/customers");
}
