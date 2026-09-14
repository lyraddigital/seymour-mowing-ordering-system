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
    route("customers", "routes/customers.tsx"),
    route("customers/new", "routes/customers.new.tsx"),
    route("customers/:customerId", "routes/customers.$customerId.tsx"),
  ]),
] satisfies RouteConfig;
