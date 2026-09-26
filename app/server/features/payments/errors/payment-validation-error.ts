import type { RecordPaymentFieldErrors } from "../types/record-payment-input";

export class PaymentValidationError extends Error {
  constructor(public readonly fieldErrors: RecordPaymentFieldErrors) {
    super("Check the payment details.");
    this.name = "PaymentValidationError";
  }
}
