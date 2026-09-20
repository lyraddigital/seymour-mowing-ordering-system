export interface CreateInvoiceItemInput {
  jobId: string;
  description: string;
  amountCents: number;
}

export type CreateInvoiceItemFieldErrors = Partial<
  Record<keyof CreateInvoiceItemInput, string>
>;
