# Seymour engineering rules

## Product scope and domain invariants

* Seymour is a small internal turf-management administration system for a very small authorised user base.
* Current primary navigation is: Dashboard, Customers, Jobs, Invoices, Payments.
* Do not implement Reports, general Settings, Expenses, Suppliers, tax-deduction workflows, or material cost pricing unless explicitly scoped later.
* All customer-facing monetary values are stored as integer cents. Never use floating-point values for money.
* Customer-facing prices are GST-inclusive. Assume standard Australian GST applies to billable lines unless requirements are explicitly changed.
* Customers are archived/restored, not deleted. Archiving must preserve all jobs, invoices, payments, and history.
* Jobs are operational records. Supported lifecycle states are Scheduled, In Progress, Completed, and Cancelled.
* A Scheduled job may move directly to Completed or to In Progress. An In Progress job may move to Completed. Cancellation is allowed only where the business rules permit it and never after the job has been completed/invoiced in a way that would destroy history.
* Jobs may contain simple service pricing or itemised service/material lines. Do not introduce supplier or cost-price concepts yet.
* A job linked/reserved by a draft invoice cannot be deleted until it is released from that draft. Deleting the draft releases its jobs.
* A job linked to an issued invoice cannot be physically deleted while that issued relationship exists.
* Invoice items are billing records, not job items and not jobs. Job/job-item data may be used to create invoice items, but invoice items own their own description, quantity, price, GST, totals, and ordering.
* Draft invoice items may be edited, combined, renamed, summarised, or manually added without mutating the source job/job items.
* Issued invoices and issued invoice items are immutable financial snapshots.
* Draft invoices may be deleted. Issued invoices are never physically deleted; corrections use void/replacement behaviour.
* Invoice numbers are permanent once issued and must never be reused, including after an invoice is voided.
* Voiding an issued invoice preserves the invoice/history and makes its jobs eligible for re-invoicing according to the invoice service rules.
* Use an invoice-to-job association model that can preserve historical relationships (for example `invoice_jobs`) rather than assuming a job has only one invoice ID for all time.
* Payments belong to one invoice. An invoice may have many payments.
* A recorded payment must not exceed the invoice's outstanding balance.
* Incorrect payments are voided rather than physically deleted; voided payments do not contribute to the paid balance.
* Authentication requirements, when implemented, are: pre-created authorised users only, email + password, mandatory email verification/MFA for sign-in, email-based password recovery, and no public registration.

# Seymour architectural constraints

## Runtime and framework

* Use React Router v8 **Framework Mode**, TypeScript in strict mode, and SSR on Cloudflare Workers.
* Preserve the official Cloudflare/React Router application shape and entry points, including `app/root.tsx`, `app/routes.ts`, `workers/app.ts`, the React Router plugin, and the Cloudflare Vite plugin.
* Do not introduce a Node server, Cloudflare Pages adapter, SPA-only router, React Server Components, another backend framework, or another runtime without an explicit architectural decision.
* Define routes in `app/routes.ts` and use generated `Route.*` types for route exports.
* Prefer server loaders/actions and ordinary HTML forms for reads and writes. Use client-side React only where genuine interactivity materially improves the UX.
* Do not introduce a separate REST or GraphQL API merely to move data between this application's own server-rendered routes and UI.

## Server-only code and Cloudflare bindings

* Use Cloudflare bindings for infrastructure access.
* Access runtime bindings through the Cloudflare Workers environment used by the React Router/Cloudflare template.
* Keep database access, secrets, credentials, email-provider code, authentication code, and other server-only logic in `.server.ts` modules or clearly server-only directories.
* Never serialize Cloudflare bindings, secrets, password material, session secrets, or provider credentials to the browser.
* Do not keep mutable request state, authenticated-user state, or database clients in global singletons.

## D1 and Drizzle

* D1 is the application database. Drizzle is the schema/query layer.
* Create D1/Drizzle clients through the established `createDb(env.DB)` helper in `app/db/client.server.ts` or its agreed successor.
* Keep schema declarations in the project's established schema modules and only add business-domain tables for explicitly scoped features.
* Generate SQL migrations with Drizzle Kit. Review and commit migration output under `drizzle/migrations`.
* Wrangler owns application of migrations to local/staging/production D1. Never run migrations from application request handlers.
* Do not use direct schema pushes against shared staging or production databases.
* Drizzle migrations use a nested layout under `drizzle/migrations`. Every D1 binding in `wrangler.jsonc` must configure both:

```jsonc
"migrations_dir": "drizzle/migrations",
"migrations_pattern": "drizzle/migrations/*/migration.sql"
```

* If the migration layout is intentionally changed, update both Drizzle and Wrangler configuration together and verify migration discovery before merging.
* The default/local, staging, and production environments must use separate D1 databases. Never run automated tests against staging or production D1.

## Environments, Wrangler, and secrets

* Keep Wrangler configuration as the source of truth for Worker names, bindings, compatibility settings, and environment configuration.
* The default Wrangler environment is local. Staging and production have separate Workers and separate D1 databases.
* Repeat non-inherited bindings/variables where Wrangler requires environment-specific configuration.
* Select the Cloudflare environment using the project's established build-time `CLOUDFLARE_ENV` workflow. Do not casually change deployment semantics without checking the Cloudflare Vite plugin behaviour.
* Generate `worker-configuration.d.ts` using `npm run cf-typegen`. Never hand-edit generated Worker bindings or `.react-router/types`.
* Keep local secrets in ignored `.dev.vars` files and deployed secrets in Cloudflare's secret mechanism. Never commit real credentials, API keys, OTP secrets, password-reset secrets, or production identifiers that are intended to remain private.
* Placeholder remote D1 IDs must be replaced only with verified environment-specific IDs before deployment.

## Testing

* Use Vitest for behavioural/unit/integration testing.
* Workers-runtime tests must use Cloudflare's supported `@cloudflare/vitest-plugin` integration.
* Keep Vitest on the Cloudflare-supported Vitest 4 range; use `vitest@^4.1.0` unless current official Cloudflare guidance/package peer dependencies require another compatible 4.x release.
* Do not build a direct Miniflare test harness or depend on Miniflare internals unless an explicit architectural decision requires it. The Cloudflare Vitest plugin may use Miniflare internally; application tests should target the supported plugin API.
* Configure the Cloudflare Vitest integration against the project Wrangler config and use the provided Workers-runtime APIs/bindings for integration tests.
* D1 integration tests must run against local isolated test storage only and must never contact remote D1.
* Preserve test isolation. Fixtures must not reuse persisted development data or shared remote resources.
* Prioritise tests for domain invariants and financial state transitions over superficial UI snapshot tests.

## Application structure and business logic

* Keep route loaders/actions thin. Put non-trivial business operations in focused server-side service modules.
* Financial/domain invariants must be enforced in server-side services/database operations, not only through disabled buttons or client-side validation.
* When invoice functionality is implemented, issuing, voiding, releasing jobs, payment validation, invoice-number allocation, and invoice-item snapshot behaviour must be centralised in domain services with tests.
* Treat the database as the source of truth for persisted business state. Do not duplicate authoritative financial totals across multiple mutable representations unless there is an explicit consistency strategy.

## UI

* Preserve the Seymour green visual direction and the established authenticated application shell.
* Authenticated navigation remains Dashboard, Customers, Jobs, Invoices, Payments unless scope changes explicitly.
* The logged-in account area belongs at the bottom of the left sidebar and should provide access to account/security actions and logout when authentication is implemented.
* Removing the general Settings module does not remove personal account/security/logout functionality.
* Preserve accessible semantic HTML, keyboard usability, clear destructive-action warnings, and responsive behaviour.
* Important financial transitions must be explicit in the UX. In particular, issuing an invoice must clearly warn that the issued invoice becomes locked/immutable.

## Dependency and generated-file policy

* Use npm and commit `package-lock.json`.
* Prefer versions supported by the current official Cloudflare/React Router integration over upgrading to an unsupported newer major version merely because it exists.
* Do not edit generated build output, generated runtime types, dependency contents, or local emulator state.
* Keep changes focused on the requested feature and avoid opportunistic framework/dependency rewrites.

## CI and completion requirements

* Pull requests must pass the repository CI workflow.
* CI must run at minimum:

```bash
npm ci
npm run check
npm run build
```

* CI must not deploy Workers or apply staging/production D1 migrations unless deployment automation is explicitly introduced in a later scoped change.
* Before completing a code change, run the relevant formatter/linter/typecheck/tests and the Workers build. Report any command that could not be run or did not pass.
* Do not proceed into adjacent features that were not part of the requested task.
