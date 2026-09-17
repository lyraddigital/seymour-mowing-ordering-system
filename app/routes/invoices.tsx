import type { Route } from "./+types/invoices";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { listInvoices } from "../server/features/invoices/queries/list-invoices.server";
import InvoicesPage from "../ui/features/invoices/pages/invoices-page/invoices-page";

export async function loader({ context }: Route.LoaderArgs) {
  try {
    return {
      invoices: await listInvoices(
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

export default function InvoicesRoute({ loaderData }: Route.ComponentProps) {
  return <InvoicesPage invoices={loaderData.invoices} />;
}
