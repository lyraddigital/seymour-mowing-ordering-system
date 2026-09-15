import { JobValidationError } from "../errors/job-validation-error";
import type {
  CreateJobInput,
  CreateJobFieldErrors,
} from "../types/create-job-input";

export function validateCreateJob(input: CreateJobInput): CreateJobInput {
  const name = input.name.trim();
  const customerId = input.customerId.trim();
  const scheduledDate = input.scheduledDate.trim();
  const description = input.description.trim();
  const fieldErrors: CreateJobFieldErrors = {};
  if (!name) fieldErrors.name = "Enter a job name.";
  else if (name.length > 200) fieldErrors.name = "Use 200 characters or fewer.";
  if (!customerId) fieldErrors.customerId = "Select an active customer.";
  if (!scheduledDate) {
    fieldErrors.scheduledDate = "Enter a scheduled date.";
  } else {
    const date = new Date(`${scheduledDate}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate) ||
      scheduledDate.startsWith("0000") ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== scheduledDate
    ) {
      fieldErrors.scheduledDate = "Enter a valid scheduled date.";
    }
  }
  if (!description) fieldErrors.description = "Enter a job description.";
  else if (description.length > 2000)
    fieldErrors.description = "Use 2,000 characters or fewer.";
  if (Object.keys(fieldErrors).length)
    throw new JobValidationError(fieldErrors);
  return { name, customerId, scheduledDate, description };
}
