import { drizzle } from "drizzle-orm/d1";

import * as schema from "../schema/schema-registry";

export function createDb(binding: Env["DB"]) {
  return drizzle(binding, { schema });
}
