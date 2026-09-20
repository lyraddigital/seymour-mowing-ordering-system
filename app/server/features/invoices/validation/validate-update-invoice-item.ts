import { InvoiceItemValidationError } from "../errors/invoice-item-validation-error";
import type { UpdateInvoiceItemInput } from "../types/update-invoice-item-input";

export function validateUpdateInvoiceItem(
  input: UpdateInvoiceItemInput,
): UpdateInvoiceItemInput {
  const description = input.description.trim();

  const fieldErrors: Partial<Record<keyof UpdateInvoiceItemInput, string>> = {};

  if (!description) {
    fieldErrors.description = "Enter an item description.";
  } else if (description.length > 500) {
    fieldErrors.description = "Use 500 characters or fewer.";
  }

  if (!Number.isSafeInteger(input.amountCents) || input.amountCents < 0) {
    fieldErrors.amountCents = "Enter a valid amount.";
  }

  if (Object.keys(fieldErrors).length) {
    throw new InvoiceItemValidationError(fieldErrors);
  }

  return {
    description,
    amountCents: input.amountCents,
  };
}
