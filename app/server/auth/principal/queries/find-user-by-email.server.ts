import { eq } from "drizzle-orm";

import { createDb } from "../../../db/client/create-db.server";
import { users } from "../../../db/schema/users";

export async function findUserByEmail(
  binding: Env["DB"],
  normalizedEmail: string,
) {
  const db = createDb(binding);

  return db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .get();
}
