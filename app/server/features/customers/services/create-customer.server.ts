import { can } from "../../../auth/authorization/policies/can";
import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import type { CreateCustomerInput } from "../types/create-customer-input";
import { CustomerValidationError } from "../errors/customer-validation-error";
export async function createCustomer(
  binding: Env["DB"],
  user: CurrentUser,
  input: CreateCustomerInput,
) {
  if (!can(user, "customers.manage")) {
    throw new PermissionDeniedError();
  }
  const name = input.name.trim();
  if (!name) {
    throw new CustomerValidationError();
  }
  const now = Date.now();
  const id = crypto.randomUUID();
  await createDb(binding)
    .insert(customers)
    .values({
      id,
      name,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      addressLine1: input.addressLine1?.trim() || null,
      addressLine2: input.addressLine2?.trim() || null,
      suburb: input.suburb?.trim() || null,
      state: input.state?.trim() || null,
      postcode: input.postcode?.trim() || null,
      notes: input.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  return { id };
}
