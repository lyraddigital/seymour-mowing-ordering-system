import { eq } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import type { CustomerDetails } from "../types/customer-details";

export async function getCustomerById(
  binding: Env["DB"],
  user: CurrentUser,
  customerId: string,
): Promise<CustomerDetails | null> {
  if (!can(user, "customers.read")) {
    throw new PermissionDeniedError();
  }

  const customer = await createDb(binding)
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
      notes: customers.notes,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .get();

  return customer ?? null;
}
