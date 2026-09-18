import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { getInvoiceById } from "../server/features/invoices/queries/get-invoice-by-id.server";
import InvoicePage from "../ui/features/invoices/pages/invoice-page/invoice-page";
import type { Route } from "./+types/invoices.$invoiceId";

export async function loader({ context, params }: Route.LoaderArgs) {
  try {
    const user = context.get(currentUserContext);

    const result = await getInvoiceById(
      context.get(runtimeContext).env.DB,
      user,
      params.invoiceId,
    );

    if (!result) {
      throw new Response("Invoice not found", {
        status: 404,
      });
    }

    return {
      invoice: result.invoice,
      items: result.items,
      canManage: can(user, "invoices.manage"),
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", {
        status: 403,
      });
    }

    throw error;
  }
}

export default function InvoiceRoute({ loaderData }: Route.ComponentProps) {
  return (
    <InvoicePage
      invoice={loaderData.invoice}
      items={loaderData.items}
      canManage={loaderData.canManage}
    />
  );
}
