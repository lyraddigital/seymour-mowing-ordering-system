export class InvoiceStateConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceStateConflictError";
  }
}
