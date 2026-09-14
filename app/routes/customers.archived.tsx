import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import type { Route } from "./+types/customers.archived";
import { listArchivedCustomers } from "../server/features/customers/queries/list-archived-customers.server";
import ArchivedCustomersPage from "../ui/features/customers/pages/archived-customers-page/archived-customers-page";

export async function loader({ context }: Route.LoaderArgs) {
  try {
    return {
      customers: await listArchivedCustomers(
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

export default function ArchivedCustomersRoute({
  loaderData,
}: Route.ComponentProps) {
  return <ArchivedCustomersPage customers={loaderData.customers} />;
}
