import type { Route } from "./+types/invoices";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { listInvoices } from "../server/features/invoices/queries/list-invoices.server";
import InvoicesPage from "../ui/features/invoices/pages/invoices-page/invoices-page";
import { can } from "../server/auth/authorization/policies/can";

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const user = context.get(currentUserContext);

    return {
      invoices: await listInvoices(context.get(runtimeContext).env.DB, user),
      canManage: can(user, "invoices.manage"),
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    throw error;
  }
}

export default function InvoicesRoute({ loaderData }: Route.ComponentProps) {
  return (
    <InvoicesPage
      invoices={loaderData.invoices}
      canManage={loaderData.canManage}
    />
  );
}
