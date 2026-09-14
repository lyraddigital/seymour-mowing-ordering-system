export class CustomerValidationError extends Error {
  readonly fieldErrors = { name: "Enter a customer name." };
  constructor() {
    super("Customer details are invalid.");
    this.name = "CustomerValidationError";
  }
}
