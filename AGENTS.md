# Seymour Engineering Rules

## Purpose

Seymour is a small internal turf-management administration system.

The codebase must optimise for:

- readability
- discoverability
- explicit ownership
- modularity
- strong server-side invariants
- clear UI/server boundaries
- platform-native React Router / Cloudflare patterns
- low accidental complexity

Do not optimise for the fewest files or the fewest folders.

A developer should be able to infer what a file contains from its path before opening it.

---

# 1. Top-level application structure

Keep the application split into three clear concerns:

```text
app/
  root.tsx
  routes.ts

  routes/
  ui/
  server/
```

Ownership:

## `app/routes/`

React Router route modules only.

Route modules are framework adapters. They may connect:

- route loader/action/middleware APIs
- server-side use cases/services
- UI pages/layouts

They should not contain substantial UI implementation or business/server implementation.

## `app/ui/`

Browser-rendered presentation concerns:

- pages
- layouts
- reusable components
- error presentation
- styles

UI modules must not directly query D1 or validate Cloudflare Access tokens.

## `app/server/`

Server-only application/runtime concerns:

- authentication
- authorization
- middleware
- request contexts
- database
- persistence queries
- domain/application services
- external provider adapters

Server modules must not render React components.

This split is deliberate even though React Router is a full-stack/server-routed framework.

Routes are the boundary that joins UI and server concerns.

---

# 2. Route modules are thin adapters

React Router route modules live in:

```text
app/routes/
```

Keep them small.

A route module may contain framework exports such as:

- `loader`
- `action`
- `middleware`
- `meta`
- `headers`
- `ErrorBoundary`
- default route component

But implementation should be delegated when it becomes meaningful.

Example:

```text
app/routes/dashboard.tsx
        ↓
app/ui/pages/dashboard/dashboard-page.tsx
```

A route loader/action may call:

```text
app/server/...
```

A route component may render:

```text
app/ui/...
```

Do not put D1 queries, JWT verification, large forms, or large page layouts directly in route modules.

---

# 3. Root route

`app/root.tsx` is a required React Router framework boundary.

Keep it, but keep it thin.

It should primarily wire together:

- document layout
- root outlet
- root error boundary
- root-level links/meta when necessary

Move substantial implementation into `app/ui/`.

Preferred shape:

```text
app/
  root.tsx

  ui/
    document/
      app-document.tsx
    errors/
      root-error-boundary.tsx
      get-route-error-presentation.ts
    styles/
      global.css
      theme.css
```

`app/root.tsx` should not become the home for:

- application shell UI
- navigation
- error-message policy
- feature styles
- business logic
- authentication logic

The root file is a framework adapter, not a general application module.

---

# 4. Folder names describe file purpose

“One concept per file” is not enough.

Files with different reasons for existing should also be grouped by kind.

Do not place types, errors, services, middleware, queries, and configuration validators side-by-side in one large feature folder.

Prefer:

```text
feature/
  types/
  errors/
  config/
  services/
  queries/
  policies/
  middleware/
```

Use only the categories a feature actually needs.

Do not create empty or speculative folders.

A folder should answer:

> What kind of file will I find here?

A filename should answer:

> What concept/operation does this file own?

---

# 5. One concept per file

A file should normally have one primary public export.

Good:

```text
types/access-identity.ts
types/access-config.ts

errors/access-authentication-error.ts

services/get-access-identity.server.ts
services/verify-access-token.server.ts

middleware/require-current-user.server.ts

queries/find-user-by-email.server.ts

policies/can.ts
```

Avoid catch-all files:

```text
types.ts
auth-types.ts
models.ts
helpers.ts
utils.ts
common.ts
services.ts
```

Private helpers may remain in the owning file when they only exist to implement that one public operation.

If a helper becomes independently meaningful, reused, separately testable, or a separate reason to change, move it into its own appropriately named file/folder.

---

# 6. Preferred current auth/server structure

Refactor the authentication foundation toward:

```text
app/
  server/
    auth/
      access/
        types/
          access-config.ts
          access-identity.ts
          access-runtime-settings.ts
          access-token-claims.ts

        errors/
          access-authentication-error.ts
          access-configuration-error.ts
          access-unavailable-error.ts

        config/
          validate-access-config.server.ts

        services/
          get-access-identity.server.ts
          verify-access-token.server.ts

      authorization/
        types/
          permission.ts
          user-role.ts

        policies/
          role-permissions.ts
          can.ts

      principal/
        types/
          current-user.ts

        errors/
          user-inactive-error.ts
          user-not-provisioned-error.ts

        queries/
          find-user-by-email.server.ts

        services/
          resolve-current-user.server.ts

        middleware/
          require-current-user.server.ts

      context/
        access-identity-context.ts
        current-user-context.ts
        runtime-context.ts

      normalizers/
        normalize-account-email.ts

    db/
      client/
        create-db.server.ts

      schema/
        users.ts
        schema-registry.ts
```

This is a target ownership model, not a requirement to add folders that have no real contents.

---

# 7. Clean UI structure

Presentation code lives under:

```text
app/ui/
```

Prefer purpose-oriented folders:

```text
app/
  ui/
    document/
      app-document.tsx

    components/
      brand/
        brand.tsx
        brand.module.css

    layouts/
      app-shell/
        app-shell.tsx
        app-sidebar.tsx
        app-navigation.tsx
        account-summary.tsx
        app-shell.module.css

    pages/
      dashboard/
        dashboard-page.tsx
        dashboard-page.module.css

    errors/
      root-error-boundary.tsx
      get-route-error-presentation.ts

    styles/
      theme.css
      global.css
```

## Pages

A page is route-level presentation.

Pages should be easy to discover under:

```text
app/ui/pages/
```

Route modules may render a page component.

## Layouts

Application shells/layout composition live under:

```text
app/ui/layouts/
```

Do not put the whole shell implementation in `app/routes/app-layout.tsx`.

The route module wires loader/middleware data into the UI layout.

## Components

Reusable presentation components live under:

```text
app/ui/components/
```

Do not extract every small JSX fragment automatically.

Extract a component when it:

- is reused
- owns meaningful presentation behaviour
- has a clear independent responsibility
- materially improves readability

## CSS

Keep only true application-wide CSS global.

Use:

```text
app/ui/styles/theme.css
app/ui/styles/global.css
```

for:

- design tokens/custom properties
- reset/base rules
- truly global accessibility/focus behaviour

Use CSS Modules for component/page/layout-specific styles:

```text
*.module.css
```

Avoid one `app.css` containing root, shell, page, and error styles together.

---

# 8. Server readability

Server code is written for humans first.

A `.server.ts` file should normally have one primary responsibility.

If a file owns several of these, split it:

- configuration parsing
- provider integration
- JWT/crypto verification
- persistence queries
- domain policy
- middleware
- HTTP response mapping
- data transformation

Do not compress server code merely because Prettier allows it.

Use deliberate blank lines between conceptual phases.

Prefer:

```ts
const token = request.headers.get("Cf-Access-Jwt-Assertion");

if (!token) {
  throw new AccessAuthenticationError();
}

const claims = await verifyAccessToken(token, config);

const email = normalizeAccountEmail(claims.email);

if (!email) {
  throw new AccessAuthenticationError();
}

return {
  email,
};
```

Use braces for meaningful guard clauses.

Functions should operate at one level of abstraction.

---

# 9. Dependency direction

Application flow:

```text
route module
    ↓
server use case/service
    ↓
query/provider/persistence
```

Presentation flow:

```text
route module
    ↓
UI page/layout
    ↓
UI component
```

Authentication flow:

```text
Cloudflare Access assertion
    ↓
Access verifier
    ↓
Access identity
    ↓
request context
    ↓
current-user middleware
    ↓
principal resolver
    ↓
authorization policy
```

Rules:

- UI does not import database modules
- UI does not verify authentication tokens
- server modules do not import React components
- pure policy modules do not import React Router
- persistence/query modules do not construct HTTP responses
- routes translate framework requests/responses and coordinate the two sides

---

# 10. Authentication

Seymour does not own credentials.

Authentication is delegated to:

- Cloudflare Access
- Google

Do not implement:

- passwords
- password hashes
- password resets
- MFA/OTP
- login cookies
- authentication session tables
- authentication email
- public registration
- Seymour login form

Normal deployed flow:

```text
Seymour
  -> Cloudflare Access
  -> Google
  -> Access policy
  -> Seymour
```

Configure Access to:

- use Google as sole IdP unless requirements change
- use Instant Authentication
- explicitly allow approved emails
- deny by default

---

# 11. Cloudflare Access trust boundary

For the current Cloudflare Vite + Workers Static Assets architecture, use:

```text
Cf-Access-Jwt-Assertion
```

as the canonical deployed identity path.

Validate:

- cryptographic signature
- issuer
- audience
- expiry
- required claims
- email

Do not maintain a duplicate `ctx.access` identity path unless the deployment architecture changes and it is deliberately re-evaluated.

Never trust:

- query parameters
- form data
- arbitrary identity headers
- unverified JWT claims
- browser-provided user IDs

Never persist or log raw Access assertions.

Google OAuth client secrets belong in Cloudflare Zero Trust configuration, not Seymour.

---

# 12. Local authentication

Local development may use a configured developer identity only when:

```text
APP_ENV === "local"
```

Rules:

- identity comes from trusted local configuration
- request headers cannot enable it
- staging/production never fall back to it
- committed seed identities are fictional
- local seed scripts never target remote D1

---

# 13. Internal principal and authorization

Seymour maintains an internal user/principal for authorization and audit identity.

Keep external Access identity separate from internal Seymour principal.

## Authorization layout

```text
app/server/auth/authorization/
  types/
    permission.ts
    user-role.ts

  policies/
    role-permissions.ts
    can.ts
```

Keep authorization policy pure.

`can()` must not:

- throw React Router responses
- query D1
- render UI

UI visibility is not authorization.

Server-side actions/use cases enforce permissions.

Initial roles:

- `admin`
- `operator`

Do not add RBAC database tables until dynamic roles are a real requirement.

---

# 14. React Router v8 Framework Mode

Use React Router v8 Framework Mode with SSR.

Preserve:

- `app/root.tsx`
- `app/routes.ts`
- route modules
- generated `Route.*` types
- React Router Vite plugin
- Cloudflare Vite plugin

Use route modules as framework adapters.

Use:

- loaders for reads
- actions for mutations
- `<Form>` for navigation-changing submissions
- `useFetcher`/`fetcher.Form` for in-place submissions
- middleware for request-wide authenticated route concerns
- `createContext` / `RouterContextProvider` for request-scoped injected state

Never use mutable global state for current request/user.

---

# 15. Worker boundary

Keep:

```text
workers/
```

as the Cloudflare platform boundary.

Preferred shape as it grows:

```text
workers/
  app.ts

  errors/
    request-error-response.server.ts
```

`workers/app.ts` may:

1. resolve external identity
2. create router context
3. set request-scoped runtime/identity
4. delegate to React Router
5. apply cross-cutting response headers
6. map infrastructure-boundary errors

It must not:

- query business tables
- implement domain workflows
- contain JWT implementation details
- render application UI

---

# 16. D1 and Drizzle

D1 is the application database.

Drizzle is the schema/query layer.

Group DB files by purpose:

```text
app/server/db/
  client/
  schema/
```

Prefer:

```text
client/create-db.server.ts
schema/users.ts
schema/schema-registry.ts
```

The schema registry is an intentional aggregation boundary for Drizzle, not a generic barrel.

Use database constraints for durable invariants where appropriate:

- normalized unique email
- valid roles/states
- valid booleans
- relational integrity
- non-negative values

Do not rely solely on TypeScript for persisted invariants.

Do not add speculative indexes.

## Migrations

- Drizzle Kit generates migrations
- Wrangler applies migrations
- never run migrations from request handlers
- never schema-push staging/production
- never hand-edit Drizzle snapshot metadata
- never rewrite already-applied shared migration history

Preserve the configured nested migration layout.

---

# 17. Test structure mirrors source

Tests live under:

```text
tests/
```

The test tree mirrors the source tree after that prefix.

Example source:

```text
app/server/auth/access/services/verify-access-token.server.ts
```

Corresponding test:

```text
tests/app/server/auth/access/services/verify-access-token.test.ts
```

Example source:

```text
app/server/auth/authorization/policies/can.ts
```

Test:

```text
tests/app/server/auth/authorization/policies/can.test.ts
```

Example source:

```text
app/ui/errors/get-route-error-presentation.ts
```

Test:

```text
tests/app/ui/errors/get-route-error-presentation.test.ts
```

Worker tests mirror:

```text
workers/app.ts
```

under:

```text
tests/workers/app.test.ts
```

## Test support

The intentional exception is shared test infrastructure:

```text
tests/support/
  setup.ts

  fixtures/
    access-signing-key.ts
    internal-user.ts
```

Do not put feature tests directly at the root of `tests/`.

This mirror is a Seymour project convention.

---

# 18. Testing tools

Use Vitest.

Use `@cloudflare/vitest-plugin` for unit tests and D1/Workers-runtime tests.

Use Cloudflare's Worker integration test harness when whole deployed Worker behaviour genuinely needs production-like integration coverage.

Do not build a custom Miniflare harness.

Tests should validate public behaviour/invariants rather than private implementation details.

Keep D1 tests isolated and local.

Never access staging or production from automated tests.

---

# 19. Test organisation

Prefer one test subject per test file.

Examples:

```text
verify-access-token.test.ts
resolve-current-user.test.ts
can.test.ts
users.test.ts
```

One test file can contain many cases for its one subject.

Do not make one giant `auth.test.ts`.

Fixtures belong in `tests/support/fixtures`, not beside unrelated test subjects.

---

# 20. Error handling

Keep error concepts close to the server feature that owns them.

Example:

```text
auth/access/errors/
auth/principal/errors/
```

Do not identify error meaning only by HTTP status.

Keep distinct:

- invalid Access configuration
- invalid/missing Access assertion
- Access unavailable
- authenticated but not provisioned
- inactive user
- permission denied
- validation error
- not found
- unexpected infrastructure error

Translate application/server errors into React Router/HTTP responses at the appropriate boundary.

UI error presentation belongs under `app/ui/errors/`.

---

# 21. Product/domain invariants

## Current scope

Navigation:

- Dashboard
- Customers
- Jobs
- Invoices
- Payments

Do not implement unless explicitly scoped:

- Reports
- general Settings
- Expenses
- Suppliers
- material cost pricing
- tax-deduction workflows
- customer portal
- quotes
- recurring work
- scheduling optimisation

## Money / GST

- money is integer cents
- no authoritative floating-point money
- customer-facing prices are GST-inclusive
- assume standard Australian GST unless changed
- centralise financial calculations

## Dates

- audit timestamps use UTC epoch milliseconds
- business date-only values stay date-only
- avoid timezone shifting date-only values

## Customers

- archive/restore
- no destructive delete of history

## Jobs

States:

- Scheduled
- In Progress
- Completed
- Cancelled

Preserve completed/invoiced history.

Draft-reserved jobs cannot be removed until released.

## Invoices

- invoice may cover multiple jobs for one customer
- use historical invoice/job association
- job items and invoice items are separate concepts
- issued invoice/items are immutable snapshots
- invoice numbers are never reused
- corrections use void/replacement

## Payments

- one payment belongs to one invoice
- no overpayment
- incorrect payments are voided
- paid/outstanding is derived from active payments

---

# 22. UI discoverability for future features

As features are added, pages remain easy to find:

```text
app/ui/pages/
  customers/
  jobs/
  invoices/
  payments/
```

Reusable feature UI may be grouped under a page/feature folder when it is not truly global.

Example:

```text
app/ui/pages/customers/
  customers-page.tsx
  customer-table.tsx
  customer-form.tsx
  customers-page.module.css
```

Do not move server operations into UI page folders.

Server feature operations belong under:

```text
app/server/features/
```

when business features become large enough to justify feature modules.

For example later:

```text
app/server/features/customers/
  types/
  queries/
  services/
  validation/
```

Do not create these future feature folders until work begins on that feature.

---

# 23. CSS

Global CSS should be small.

Prefer:

```text
app/ui/styles/theme.css
app/ui/styles/global.css
```

Use CSS Modules for page/layout/component-specific styles.

Avoid broad global selectors for feature styling.

Maintain:

- semantic HTML
- keyboard support
- visible focus styles
- labels
- accessible errors
- clear destructive confirmations

---

# 24. CI / deployment

Maintain one canonical release path.

Use the same pinned Node version source for:

- local development
- CI
- staging
- production

Prefer `.nvmrc`.

Cloudflare deploy credentials are exposed only to migration/deploy steps.

Before deploy:

1. validate configuration
2. run checks/build
3. apply pending environment migrations
4. deploy
5. smoke test

Production must deploy the same source revision tested in staging.

---

# 25. Generated/local files

Do not commit or edit generated/local outputs:

- `node_modules`
- `.react-router`
- `build`
- `.wrangler`
- `worker-configuration.d.ts`
- `*.tsbuildinfo`
- coverage output

---

# 26. Current structural refactor priorities

For the current foundation, address in this order:

1. Introduce `app/server` and move auth/db server concerns beneath it.
2. Group auth files by purpose: types/errors/config/services/queries/policies/middleware/context.
3. Introduce `app/ui` for document/layout/page/component/error/style concerns.
4. Extract app shell UI from `app/routes/app-layout.tsx`.
5. Extract dashboard UI from `app/routes/dashboard.tsx`.
6. Reduce `app/root.tsx` to the framework/document adapter and extract error/document UI.
7. Split monolithic `app/app.css` into global/theme CSS plus CSS Modules.
8. Mirror source structure under `tests/`.
9. Move fixtures/setup into `tests/support/`.
10. Move Worker error mapping into a purpose folder if appropriate.
11. Preserve current authentication/business behaviour during the structural refactor.
12. Add/refine integration coverage only where moving boundaries could break wiring.

This is a structural/readability refactor.

Do not add business CRUD or new application behaviour while doing it.

---

# 27. Completion requirements

Before completing changes run:

```bash
npm run format
npm run check
npm run build
```

Also run staging/production build variants if environment-specific files/configuration changed.

Report any command that could not be run or did not pass.

Do not proceed into adjacent features unless explicitly requested.
