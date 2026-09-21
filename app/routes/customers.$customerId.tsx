import { can } from "../server/auth/authorization/policies/can";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { getCustomerById } from "../server/features/customers/queries/get-customer-by-id.server";
import { getCustomerFinancialHistory } from "../server/features/customers/queries/get-customer-financial-history.server";
import CustomerPage from "../ui/features/customers/pages/customer-page/customer-page";
import type { Route } from "./+types/customers.$customerId";

export async function loader({ context, params }: Route.LoaderArgs) {
  try {
    const user = context.get(currentUserContext);
    const customer = await getCustomerById(
      context.get(runtimeContext).env.DB,
      context.get(currentUserContext),
      params.customerId,
    );

    if (!customer) {
      throw new Response("Customer not found", { status: 404 });
    }

    return {
      customer,
      financialHistory:
        can(user, "invoices.read") && can(user, "payments.read")
          ? await getCustomerFinancialHistory(
              context.get(runtimeContext).env.DB,
              user,
              customer.id,
            )
          : null,
      canManage: can(context.get(currentUserContext), "customers.manage"),
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    throw error;
  }
}

export default function CustomerRoute({ loaderData }: Route.ComponentProps) {
  return (
    <CustomerPage
      customer={loaderData.customer}
      canManage={loaderData.canManage}
      financialHistory={loaderData.financialHistory}
    />
  );
}
