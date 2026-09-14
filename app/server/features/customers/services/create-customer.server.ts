import { can } from "../../../auth/authorization/policies/can";
import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import type { CreateCustomerInput } from "../types/create-customer-input";
import { validateCustomerInput } from "../validation/validate-customer-input";
export async function createCustomer(
  binding: Env["DB"],
  user: CurrentUser,
  input: CreateCustomerInput,
) {
  if (!can(user, "customers.manage")) {
    throw new PermissionDeniedError();
  }

  const values = validateCustomerInput(input);

  const now = Date.now();
  const id = crypto.randomUUID();
  await createDb(binding)
    .insert(customers)
    .values({
      id,
      ...values,
      createdAt: now,
      updatedAt: now,
    });
  return { id };
}
