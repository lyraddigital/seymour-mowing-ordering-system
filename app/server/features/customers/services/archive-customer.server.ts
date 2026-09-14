import { and, eq, isNull } from "drizzle-orm";
import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { CustomerNotFoundError } from "../errors/customer-not-found-error";
import { CustomerStateConflictError } from "../errors/customer-state-conflict-error";

export async function archiveCustomer(
  binding: Env["DB"],
  user: CurrentUser,
  customerId: string,
) {
  if (!can(user, "customers.manage")) {
    throw new PermissionDeniedError();
  }

  const db = createDb(binding);
  const now = Date.now();
  const updated = await db
    .update(customers)
    .set({ archivedAt: now, updatedAt: now })
    .where(and(eq(customers.id, customerId), isNull(customers.archivedAt)))
    .returning({ id: customers.id })
    .get();

  if (!updated) {
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId))
      .get();
    if (!existing) {
      throw new CustomerNotFoundError();
    }
    throw new CustomerStateConflictError("Customer is already archived.");
  }

  return updated;
}
