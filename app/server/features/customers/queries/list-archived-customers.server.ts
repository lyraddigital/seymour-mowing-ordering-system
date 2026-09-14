import { can } from "../../../auth/authorization/policies/can";
import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { asc, isNotNull } from "drizzle-orm";
import type { CustomerSummary } from "../types/customer-summary";
export async function listArchivedCustomers(
  binding: Env["DB"],
  user: CurrentUser,
): Promise<CustomerSummary[]> {
  if (!can(user, "customers.read")) {
    throw new PermissionDeniedError();
  }
  return createDb(binding)
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      addressLine1: customers.addressLine1,
      addressLine2: customers.addressLine2,
      suburb: customers.suburb,
      state: customers.state,
      postcode: customers.postcode,
    })
    .from(customers)
    .where(isNotNull(customers.archivedAt))
    .orderBy(asc(customers.name), asc(customers.id));
}
