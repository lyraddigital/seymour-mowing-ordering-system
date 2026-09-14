/// <reference types="@cloudflare/vitest-plugin/types" />

import { applyD1Migrations, type D1Migration } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { inject } from "vitest";

declare module "vitest" {
  export interface ProvidedContext {
    migrations: D1Migration[];
  }
}

await applyD1Migrations(env.DB, inject("migrations"));
