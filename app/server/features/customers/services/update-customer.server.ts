import { eq } from "drizzle-orm";

import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { CustomerNotFoundError } from "../errors/customer-not-found-error";
import type { UpdateCustomerInput } from "../types/update-customer-input";
import { validateCustomerInput } from "../validation/validate-customer-input";

export async function updateCustomer(
  binding: Env["DB"],
  user: CurrentUser,
  customerId: string,
  input: UpdateCustomerInput,
) {
  if (!can(user, "customers.manage")) {
    throw new PermissionDeniedError();
  }

  const values = validateCustomerInput(input);

  const updated = await createDb(binding)
    .update(customers)
    .set({ ...values, updatedAt: Date.now() })
    .where(eq(customers.id, customerId))
    .returning({ id: customers.id })
    .get();

  if (!updated) {
    throw new CustomerNotFoundError();
  }

  return updated;
}
