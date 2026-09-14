export class CustomerStateConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerStateConflictError";
  }
}
