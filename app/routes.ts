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
    route("jobs", "routes/jobs.tsx"),
    route("jobs/new", "routes/jobs.new.tsx"),
    route("jobs/history", "routes/jobs.history.tsx"),
    route("jobs/:jobId", "routes/jobs.$jobId.tsx"),
    route("jobs/:jobId/complete", "routes/jobs.$jobId.complete.tsx"),
    route("jobs/:jobId/start", "routes/jobs.$jobId.start.tsx"),
    route("jobs/:jobId/cancel", "routes/jobs.$jobId.cancel.tsx"),
    route(
      "customers/:customerId/archive",
      "routes/customers.$customerId.archive.tsx",
    ),
    route(
      "customers/:customerId/restore",
      "routes/customers.$customerId.restore.tsx",
    ),
    route("customers/archived", "routes/customers.archived.tsx"),
    route("customers/new", "routes/customers.new.tsx"),
    route(
      "customers/:customerId/edit",
      "routes/customers.$customerId.edit.tsx",
    ),
    route("customers/:customerId", "routes/customers.$customerId.tsx"),
  ]),
] satisfies RouteConfig;
