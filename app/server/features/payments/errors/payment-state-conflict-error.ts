export class PaymentStateConflictError extends Error {
  constructor() {
    super("This payment has already been voided.");
    this.name = "PaymentStateConflictError";
  }
}
