import { JobItemValidationError } from "../errors/job-item-validation-error";
import type {
  CreateJobItemFieldErrors,
  CreateJobItemInput,
} from "../types/create-job-item-input";

export function validateCreateJobItem(
  input: CreateJobItemInput,
): CreateJobItemInput {
  const description = input.description.trim();

  const fieldErrors: CreateJobItemFieldErrors = {};

  if (!description) {
    fieldErrors.description = "Enter an item description.";
  } else if (description.length > 500) {
    fieldErrors.description = "Use 500 characters or fewer.";
  }

  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) {
    fieldErrors.quantity = "Enter a positive whole-number quantity.";
  }

  if (!Number.isSafeInteger(input.unitPriceCents) || input.unitPriceCents < 0) {
    fieldErrors.unitPriceCents = "Enter a valid unit price.";
  }

  if (
    !Object.keys(fieldErrors).length &&
    !Number.isSafeInteger(input.quantity * input.unitPriceCents)
  ) {
    fieldErrors.unitPriceCents = "The line amount is too large.";
  }

  if (Object.keys(fieldErrors).length) {
    throw new JobItemValidationError(fieldErrors);
  }

  return {
    description,
    quantity: input.quantity,
    unitPriceCents: input.unitPriceCents,
  };
}
