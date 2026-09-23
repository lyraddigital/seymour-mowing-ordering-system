import type { IssueInvoiceFieldErrors } from "../types/issue-invoice-input";

export class IssueInvoiceValidationError extends Error {
  constructor(public readonly fieldErrors: IssueInvoiceFieldErrors) {
    super("Check the invoice details.");
    this.name = "IssueInvoiceValidationError";
  }
}
