export class CustomerNotFoundError extends Error {
  constructor() {
    super("Customer not found.");
    this.name = "CustomerNotFoundError";
  }
}
