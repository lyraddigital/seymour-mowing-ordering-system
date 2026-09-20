import type { Route } from "./+types/payments";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { listPayments } from "../server/features/payments/queries/list-payments.server";
import PaymentsPage from "../ui/features/payments/pages/payments-page/payments-page";

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const user = context.get(currentUserContext);

    return {
      payments: await listPayments(context.get(runtimeContext).env.DB, user),
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw new Response("Forbidden", { status: 403 });
    }

    throw error;
  }
}

export default function PaymentsRoute({ loaderData }: Route.ComponentProps) {
  return <PaymentsPage payments={loaderData.payments} />;
}
