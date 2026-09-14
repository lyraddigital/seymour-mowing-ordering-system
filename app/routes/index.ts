import { redirect } from "react-router";
import type { Route } from "./+types/index";

export const loader = (() => redirect("/dashboard")) satisfies (
  args: Route.LoaderArgs,
) => Response;
