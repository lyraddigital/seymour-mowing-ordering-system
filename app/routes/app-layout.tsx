import { Outlet } from "react-router";

import type { Route } from "./+types/app-layout";
import { currentUserContext } from "../server/auth/context/current-user-context";
import { requireCurrentUser } from "../server/auth/principal/middleware/require-current-user.server";
import AppShell from "../ui/layouts/app-shell/app-shell";

export const middleware = [requireCurrentUser];

export function loader({ context }: Route.LoaderArgs) {
  return {
    currentUser: context.get(currentUserContext),
  };
}

export default function AppLayoutRoute({ loaderData }: Route.ComponentProps) {
  return (
    <AppShell currentUser={loaderData.currentUser}>
      <Outlet />
    </AppShell>
  );
}
