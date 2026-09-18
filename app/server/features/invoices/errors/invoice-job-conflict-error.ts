export class InvoiceJobConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceJobConflictError";
  }
}
