# Cloudflare Access + Google setup

Complete these infrastructure steps before releasing this branch. No remote configuration, migrations or deployments are performed by feature development.

## Google identity provider

Create a Google OAuth **Web application** client (and configure its consent screen/audience for the intended accounts). Set the authorized JavaScript origin to `https://<team-name>.cloudflareaccess.com` and the authorized redirect URI to `https://<team-name>.cloudflareaccess.com/cdn-cgi/access/callback`.

In Cloudflare Zero Trust, open **Integrations > Identity providers** and add Google using that client ID and secret. The Google client secret stays in Zero Trust; never add it to Seymour, Wrangler secrets, D1 or Git. See [Cloudflare's Google setup](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/google/).

## Protect staging and production

Create separate Access applications for the staging and production hostnames. Cover the whole hostname, including static assets and React Router data requests. Protect or disable alternate workers.dev and preview hostnames so there is no unprotected front door.

Use Google as the **only login method**, turn off accepting all identity providers, and enable **Instant Authentication**. Set the initial session duration to **7 days**. Use an Allow policy containing **specific approved email addresses**, never all `@gmail.com` accounts. Staging can initially allow only the developer; production should list only approved client/admin accounts. Avoid Bypass policies. See [self-hosted application setup](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

Copy the real HTTPS team-domain issuer and each application's AUD into the corresponding staging/production `vars` in `wrangler.jsonc`: `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`. Replace the explicit placeholders before release. The application fails with 503 if configuration is incomplete; it never falls back to a development identity in deployed mode. The AUD is the Access application's 64-character hexadecimal audience tag, not a Google client ID.

## Two checks must pass

Access's allow-list controls front-door authentication/access. Seymour's `users` table controls internal active status, role and permissions. An Access-approved email must also match an active internal user. Provision approved internal users through a reviewed administrative database change under the release process; no remote provisioning tool is included here. Use an application-generated UUID, normalized email, display name, explicit role, and UTC epoch-millisecond timestamps. Deactivate/reactivate users rather than deleting them.

Admins receive all defined permissions. Operators manage Customers and Jobs and read Invoices and Payments; they cannot manage Invoices, Payments or Users. The centralized policy is in `app/auth/authorization.ts`. No business CRUD is implemented in this slice.

## Request trust boundary

The Worker prefers genuine `ctx.access.getIdentity()` only when its audience matches the configured application. Workers Static Assets currently does not propagate this context to the user Worker, so the normal deployed path validates `Cf-Access-Jwt-Assertion` using `jose` and the team's `/cdn-cgi/access/certs` JWKS endpoint. Validation checks the RS256 signature, issuer, audience, expiry, and required identity claims before using the email. Public verification keys may be cached; user identity is never cached globally or persisted as a credential. See [Workers Access integration](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) and [JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

The Worker supplies runtime and validated identity contexts through React Router's `RouterContextProvider`. Authenticated layout server middleware looks up the active internal user in D1, stores a minimal principal in context, then allows downstream routes to execute. Unknown or inactive users receive the same branded 403 page. Responses carrying user data are private and not cached.

## Local development

Only explicit `APP_ENV=local` uses `DEV_AUTH_EMAIL`. The default identity is the fictional `developer@example.test`; the local SQL seed inserts its matching admin account. Request headers cannot activate this bypass. Local sign-out cannot terminate the configured identity; Access logout is meaningful on protected deployments. Never deploy the local Worker configuration.

If an obsolete PR1 migration was applied to your disposable development database, recreate that local database before applying this rewritten initial migration. Never rewrite shared migration history. This branch replaces only an uncommitted/unreleased migration.

## Release verification

The existing manual release workflows apply remote migrations and deploy the selected environment. Their smoke check requests the root URL **without following redirects**, verifies a 3xx response with an Access login location, and reports only that the Access gate is reachable. It does not verify the Worker, D1, Google login, or internal authorization.

Before production approval, manually sign into staging through Google; confirm the dashboard, account name/role and logout; confirm an Access-approved but missing/inactive internal user receives 403; and confirm an unapproved Google account is denied by Access. A service-token authenticated health check is a later DevOps improvement.
