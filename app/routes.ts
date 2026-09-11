import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.ts"),
  route("login", "routes/login.tsx"),
] satisfies RouteConfig;
