import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// Create within a loader/action using env.DB from cloudflare:workers.
// Never retain a request's database client in mutable module-level state.
export function createDb(binding: Env["DB"]) {
  return drizzle(binding, { schema });
}
