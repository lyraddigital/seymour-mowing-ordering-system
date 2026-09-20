export class PaymentOverpaymentError extends Error {
  constructor() {
    super("The payment exceeds the remaining invoice balance.");
    this.name = "PaymentOverpaymentError";
  }
}
