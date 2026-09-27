export class JobValidationError extends Error {
  constructor(public readonly fieldErrors: Record<string, string>) {
    super("Check the job details.");
    this.name = "JobValidationError";
  }
}
