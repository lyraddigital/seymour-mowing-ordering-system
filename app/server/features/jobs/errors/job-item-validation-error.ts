import type { CreateJobItemFieldErrors } from "../types/create-job-item-input";

export class JobItemValidationError extends Error {
  constructor(public readonly fieldErrors: CreateJobItemFieldErrors) {
    super("Check the job item details.");
    this.name = "JobItemValidationError";
  }
}