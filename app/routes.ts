import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";
export default [
  layout("routes/app-layout.tsx", [
    index("routes/index.ts"),
    route("dashboard", "routes/dashboard.tsx"),
  ]),
] satisfies RouteConfig;
