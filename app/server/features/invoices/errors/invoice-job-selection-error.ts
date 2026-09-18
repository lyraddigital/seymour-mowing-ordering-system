export class InvoiceJobSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceJobSelectionError";
  }
}
