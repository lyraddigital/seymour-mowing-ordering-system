import { JobItemValidationError } from "../errors/job-item-validation-error";
import type { UpdateJobItemInput } from "../types/update-job-item-input";

export function validateUpdateJobItem(
  input: UpdateJobItemInput,
): UpdateJobItemInput {
  const description = input.description.trim();

  const fieldErrors: Partial<Record<keyof UpdateJobItemInput, string>> = {};

  if (!description) {
    fieldErrors.description = "Enter an item description.";
  } else if (description.length > 500) {
    fieldErrors.description = "Use 500 characters or fewer.";
  }

  if (!Number.isSafeInteger(input.amountCents) || input.amountCents < 0) {
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
