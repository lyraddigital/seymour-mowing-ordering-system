export class PaymentValidationError extends Error {
  constructor() {
    super("Enter a valid payment amount greater than zero.");
    this.name = "PaymentValidationError";
  }
}
