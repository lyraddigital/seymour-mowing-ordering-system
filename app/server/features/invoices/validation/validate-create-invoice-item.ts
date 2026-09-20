import { InvoiceItemValidationError } from "../errors/invoice-item-validation-error";
import type {
  CreateInvoiceItemFieldErrors,
  CreateInvoiceItemInput,
} from "../types/create-invoice-item-input";

export function validateCreateInvoiceItem(
  input: CreateInvoiceItemInput,
): CreateInvoiceItemInput {
  const description = input.description.trim();

  const fieldErrors: CreateInvoiceItemFieldErrors = {};

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
    jobId: input.jobId.trim(),
    description,
    amountCents: input.amountCents,
  };
}
