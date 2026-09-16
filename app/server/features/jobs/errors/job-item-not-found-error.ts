export class JobItemNotFoundError extends Error {
  constructor() {
    super("Job item not found.");
    this.name = "JobItemNotFoundError";
  }
}
