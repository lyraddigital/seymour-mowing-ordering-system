import { IssueInvoiceValidationError } from "../errors/issue-invoice-validation-error";
import type {
  IssueInvoiceFieldErrors,
  IssueInvoiceInput,
} from "../types/issue-invoice-input";

export function validateIssueInvoice(
  input: IssueInvoiceInput,
): IssueInvoiceInput {
  const dueDate = input.dueDate.trim();

  const fieldErrors: IssueInvoiceFieldErrors = {};

  if (!dueDate) {
    fieldErrors.dueDate = "Enter a due date.";
  } else {
    const date = new Date(`${dueDate}T00:00:00.000Z`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      dueDate.startsWith("0000") ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== dueDate
    ) {
      fieldErrors.dueDate = "Enter a valid due date.";
    }
  }

  if (Object.keys(fieldErrors).length) {
    throw new IssueInvoiceValidationError(fieldErrors);
  }

  return {
    dueDate,
  };
}
