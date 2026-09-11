# Seymour

A minimal Seymour login shell, scaffolded with the official Cloudflare C3 React Router v8 Framework Mode template on 11 September 2026. SSR runs in Workers locally and after deployment. No authentication or business-domain tables are implemented.

## Development

Use Node 22.22+ and npm (Node 24 LTS recommended) (see `.nvmrc`).

```sh
npm ci
npm run dev
```

Open http://localhost:5173; `/` redirects to `/login`. The Vite plugin runs server code in the Workers runtime and emulates D1 locally. No account or secrets are needed. `npm ci` generates Worker types through `postinstall`.

## Commands

| Command                         | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| `npm run check`                 | Formatting, ESLint, generated types, TypeScript, Vitest |
| `npm run format`                | Format source and configuration                         |
| `npm run test:watch`            | Watch behavioral tests                                  |
| `npm run build`                 | Build the local Worker configuration                    |
| `npm run build:staging`         | Build the staging Worker configuration                  |
| `npm run build:production`      | Build the production Worker configuration               |
| `npm run preview`               | Run the most recently built Worker locally              |
| `npx wrangler deploy --dry-run` | Validate packaging of the most recent build             |
| `npm run cf-typegen`            | Regenerate Wrangler binding/runtime declarations        |
| `npm run db:generate`           | Generate SQL from the Drizzle schema offline            |
| `npm run db:migrate:local`      | Apply migrations to local D1 only                       |

Vitest uses its own config. The D1 integration test uses disposable Miniflare storage and runs an actual Drizzle query without creating tables.

## Environments

| Environment | Worker            | D1 database                | Selection                   |
| ----------- | ----------------- | -------------------------- | --------------------------- |
| Local       | `seymour-local`   | `seymour-local` (emulated) | Default                     |
| Staging     | `seymour-staging` | `seymour-staging`          | `CLOUDFLARE_ENV=staging`    |
| Production  | `seymour`         | `seymour-production`       | `CLOUDFLARE_ENV=production` |

The npm environment scripts use `cross-env` so they also work on Windows. `dev:staging` and `dev:production` select those configurations while keeping bindings locally emulated. No binding is marked `remote: true`.

Remote D1 IDs in `wrangler.jsonc` are explicit placeholders, not provisioned resources. Before a first deployment, authenticate with Wrangler, verify the intended account, create separate databases with `npx wrangler d1 create seymour-staging` and `npx wrangler d1 create seymour-production`, then replace only the corresponding IDs. The all-zero local ID is for emulation only. No remote resources have been created by this scaffold.

Deploy with `npm run deploy:staging` or `npm run deploy:production`. These scripts build the selected environment before deploying. The Cloudflare Vite plugin writes a flattened configuration into `build/server/wrangler.json`; an environment flag passed only at deployment cannot change that artifact. `preview` always uses the last build, too.

No secrets are required yet. When needed, copy `.dev.vars.example` to the ignored `.dev.vars`. Use `.dev.vars.staging` or `.dev.vars.production` for local environment-specific secrets; each file must contain that environment's complete set. Set real deployed secrets through Wrangler separately for the intended environment. Never expose secrets via `VITE_*` variables.

## Database

`app/db/client.server.ts` wraps the D1 binding with Drizzle. Server loaders/actions may import `env` from `cloudflare:workers` and call `createDb(env.DB)` within the request. Browser components must not import this module.

`app/db/schema.ts` is intentionally empty. Drizzle Kit uses the SQLite dialect to generate migrations offline; Wrangler applies the generated SQL from `drizzle/migrations`. An empty schema produces no migration. Once a feature adds schema, run `npm run db:generate`, review and commit the generated files, then apply locally. Remote application is explicit: `npm run db:migrate:staging` or `npm run db:migrate:production`. Do not run these against placeholder IDs.

## Architecture and sources

See [AGENTS.md](AGENTS.md) for project constraints.

- [Cloudflare React Router guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/)
- [Cloudflare Vite environment selection](https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/)
- [Drizzle D1 driver](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1)

The template was generated with `create-cloudflare@2.72.6` and `create-react-router@8.3.1`. Keep exact resolved dependencies in the lockfile. Source maps, Worker logs, and sampled traces are enabled. Runtime types, route types, build output, secrets, and local D1 state are ignored by Git.

The D1 test runtime matches Wrangler's current Miniflare 5 alpha dependency and uses its exported v4-options converter. The scoped npm override for `@esbuild-kit/core-utils` replaces its vulnerable esbuild dependency; Drizzle Kit configuration loading and SQL generation are verified with that override.
