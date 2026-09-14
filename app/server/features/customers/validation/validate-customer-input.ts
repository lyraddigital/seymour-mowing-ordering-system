import { CustomerValidationError } from "../errors/customer-validation-error";
import type { CreateCustomerInput } from "../types/create-customer-input";

export function validateCustomerInput(input: CreateCustomerInput) {
  const name = input.name.trim();

  if (!name) {
    throw new CustomerValidationError();
  }

  return {
    name,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    addressLine1: input.addressLine1?.trim() || null,
    addressLine2: input.addressLine2?.trim() || null,
    suburb: input.suburb?.trim() || null,
    state: input.state?.trim() || null,
    postcode: input.postcode?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}
