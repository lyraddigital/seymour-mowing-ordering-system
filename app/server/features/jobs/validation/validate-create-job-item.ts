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

  if (
    !Number.isSafeInteger(input.amountCents) ||
    input.amountCents < 0
  ) {
    fieldErrors.amountCents = "Enter a valid amount.";
  }

  if (Object.keys(fieldErrors).length) {
    throw new JobItemValidationError(fieldErrors);
  }

  return {
    description,
    amountCents: input.amountCents,
  };
}