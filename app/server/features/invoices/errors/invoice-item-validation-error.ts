import type { CreateInvoiceItemFieldErrors } from "../types/create-invoice-item-input";

export class InvoiceItemValidationError extends Error {
  constructor(public readonly fieldErrors: CreateInvoiceItemFieldErrors) {
    super("Check the invoice item details.");
    this.name = "InvoiceItemValidationError";
  }
}
