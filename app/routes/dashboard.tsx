import type { Route } from "./+types/dashboard";
import DashboardPage from "../ui/features/dashboard/pages/dashboard-page/dashboard-page";

export const meta: Route.MetaFunction = () => [
  { title: "Dashboard | Seymour" },
  { name: "robots", content: "noindex, nofollow" },
];

export default function DashboardRoute() {
  return <DashboardPage />;
}
