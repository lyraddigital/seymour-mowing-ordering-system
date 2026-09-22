import type { Route } from "./+types/dashboard";
import DashboardPage from "../ui/features/dashboard/pages/dashboard-page/dashboard-page";
import { PermissionDeniedError } from "../server/auth/authorization/errors/permission-denied-error";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { runtimeContext } from "../server/auth/context/runtime-context";
import { getDashboard } from "../server/features/dashboard/queries/get-dashboard.server";

export const meta: Route.MetaFunction = () => [
  { title: "Dashboard | Seymour" },
  { name: "robots", content: "noindex, nofollow" },
];

export async function loader({ context }: Route.LoaderArgs) {
  try {
    return {
      dashboard: await getDashboard(
        context.get(runtimeContext).env.DB,
        context.get(currentUserContext),
      ),
    };
  } catch (error) {
    if (error instanceof PermissionDeniedError)
      throw new Response("Forbidden", { status: 403 });
    throw error;
  }
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  return <DashboardPage dashboard={loaderData.dashboard} />;
}
