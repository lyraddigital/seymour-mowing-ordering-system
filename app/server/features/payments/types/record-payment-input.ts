export interface RecordPaymentInput {
  amountCents: number;
  paymentDate: string;
}

export interface RecordPaymentFieldErrors {
  amount?: string;
  paymentDate?: string;
}
