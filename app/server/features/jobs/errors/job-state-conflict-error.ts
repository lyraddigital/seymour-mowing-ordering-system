export class JobStateConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobStateConflictError";
  }
}
