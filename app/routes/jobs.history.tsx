import { redirect } from "react-router";
import { can } from "../server/auth/authorization/policies/can";
import { currentUserContext } from "../server/auth/context/current-user-context";
import type { Route } from "./+types/jobs.history";

export function loader({ context }: Route.LoaderArgs) {
  if (!can(context.get(currentUserContext), "jobs.read")) {
    throw new Response("Forbidden", { status: 403 });
  }

  return redirect("/jobs?status=completed");
}
