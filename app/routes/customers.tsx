import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import type { Route } from "./+types/customers";
import { listActiveCustomers } from "../server/features/customers/queries/list-active-customers.server";
import CustomersPage from "../ui/pages/customers/customers-page";
export async function loader({ context }: Route.LoaderArgs) {
  try {
    return {
      customers: await listActiveCustomers(
        context.get(runtimeContext).env.DB,
        context.get(currentUserContext),
      ),
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }
    throw error;
  }
}
export default function CustomersRoute({ loaderData }: Route.ComponentProps) {
  return <CustomersPage customers={loaderData.customers} />;
}
