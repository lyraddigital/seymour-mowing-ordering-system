export interface IssueInvoiceInput {
  dueDate: string;
}

export type IssueInvoiceFieldErrors = Partial<
  Record<keyof IssueInvoiceInput, string>
>;
