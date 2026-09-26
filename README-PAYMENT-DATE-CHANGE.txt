PAYMENT DATE DOMAIN CHANGE

Overlay this folder at the repository root.

Then generate the Drizzle migration using the repository's normal workflow:
  npm run db:generate

Move the generated migration.sql into the generated migration directory as required by this repo's README/AGENTS conventions. Do not edit old migrations.

If the disposable local D1 cannot migrate because existing payment rows lack payment_date:
  Remove-Item -Recurse -Force .wrangler\state\v3\d1
  npm run db:migrate:local
  npm run db:seed:local

Then run:
  npm run format
  npm run lint
  npm run typecheck
  npm test

Finally verify live code has no old payment timestamp semantics:
  rg "receivedAt|received_at" app tests AGENTS.md

Historical migration files may still contain received_at and should not be edited.
