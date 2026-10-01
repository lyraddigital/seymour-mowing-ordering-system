export class JobValidationError extends Error {
  readonly fieldErrors: Partial<Record<string, string>>;

  constructor(fieldErrors: Partial<Record<string, string>>) {
    super("Job validation failed.");

    this.name = "JobValidationError";
    this.fieldErrors = fieldErrors;
  }
}
