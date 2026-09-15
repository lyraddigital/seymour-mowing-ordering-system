import type { CreateJobFieldErrors } from "../types/create-job-input";

export class JobValidationError extends Error {
  constructor(public readonly fieldErrors: CreateJobFieldErrors) {
    super("Check the job details.");
    this.name = "JobValidationError";
  }
}
