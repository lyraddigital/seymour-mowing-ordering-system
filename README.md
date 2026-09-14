# Seymour

Seymour is an internal turf-management administration app using React Router v8 Framework Mode, TypeScript, SSR on Cloudflare Workers, and D1 with Drizzle.

Cloudflare Access with Google authenticates people. Seymour resolves the validated email to an active internal user and applies its role permissions. Seymour owns no passwords, authentication sessions, MFA codes, login cookies, or authentication email delivery.

## Local development

Use Node 22.22+ (Node 24 recommended) and npm:

```sh
npm ci
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Open http://localhost:5173. The root redirects to `/dashboard`; the app shell shows the local admin account. The default Wrangler environment explicitly sets `DEV_AUTH_EMAIL=developer@example.test`, matching the fictional local SQL seed. This bypass is accepted only when `APP_ENV=local` and cannot be enabled by a request header. The seed script uses `--local` and never writes to staging or production. If changing the local identity, create its matching local user too. The seed is idempotent and does not reactivate or change existing users.

## Authentication and authorization

The internal `users` table stores UUID, normalized unique email, display name, role, active state, and UTC epoch-millisecond timestamps. D1 enforces normalized non-empty emails, valid roles and booleans. Users are deactivated/reactivated, not hard-deleted by application behavior.

`admin` has every defined permission. `operator` can manage Customers and Jobs and read Invoices and Payments. Permission checks are centralized. The sidebar is ready for those modules; only the dashboard foundation is implemented. Sign out goes to Cloudflare Access logout.

Complete [Cloudflare Access + Google setup](docs/cloudflare-access.md) before release. Both the Access email allow-list and an active Seymour user must permit the request. Missing Access configuration fails closed outside local development.

## Environments and releases

| Environment | Worker                                 | D1 database              |
| ----------- | -------------------------------------- | ------------------------ |
| Local       | seymour-local                          | seymour-local (emulated) |
| Staging     | seymour-staging-mowing-ordering-system | seymour-staging          |
| Production  | seymour-mowing-ordering-system         | seymour-production       |

Remote D1 IDs are already configured. Keep them environment-specific. The Access team-domain/AUD placeholders still need the real values from each Access application. Google OAuth secrets belong exclusively in Cloudflare Zero Trust.

Select staging/production with the existing `CLOUDFLARE_ENV` build scripts. Deploy the generated flattened Worker config without retargeting it with `--env`. Staging and production releases remain manual, and their workflows own remote migrations. Their unauthenticated smoke checks verify the Access redirect only; manually test staging through Google before production approval.

## Commands and checks

- `npm run format`: format source and configuration.
- `npm run check`: formatting, ESLint, generated types, TypeScript, Vitest.
- `npm run build`: build the local Workers configuration.
- `npm run build:staging` / `npm run build:production`: build the selected environment.
- `npm run cf-typegen`: regenerate Wrangler binding/runtime declarations.
- `npm run db:generate`: generate SQL from Drizzle offline.
- `npm run db:migrate:local` / `npm run db:seed:local`: prepare local D1.

Drizzle Kit currently emits flat SQL. Place each generated `<name>.sql` unchanged at `drizzle/migrations/<name>/migration.sql`, matching the existing Wrangler migration pattern. Retain generated snapshots/journal under `drizzle/migrations/meta`, review and commit them with the SQL. Do not edit snapshots by hand. The initial user migration replaces the unshipped custom-auth migration; disposable local databases with the old schema need recreation.

Vitest uses the supported Cloudflare plugin and applies checked-in nested migrations to isolated test D1. JWT tests use locally generated keys and never call Cloudflare or Google. Tests do not reuse development or remote databases.

See [AGENTS.md](AGENTS.md) for engineering and domain rules. Keep runtime/route types, build output, secrets and local emulator state out of Git.
