import { PaymentValidationError } from "../errors/payment-validation-error";
import type {
  RecordPaymentFieldErrors,
  RecordPaymentInput,
} from "../types/record-payment-input";

export function validateRecordPayment(
  input: RecordPaymentInput,
  today: string,
): RecordPaymentInput {
  const paymentDate = input.paymentDate.trim();
  const fieldErrors: RecordPaymentFieldErrors = {};

  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    fieldErrors.amount = "Enter a valid payment amount greater than zero.";
  }

  if (!paymentDate) {
    fieldErrors.paymentDate = "Enter a payment date.";
  } else {
    const parsed = new Date(`${paymentDate}T00:00:00.000Z`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) ||
      paymentDate.startsWith("0000") ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== paymentDate
    ) {
      fieldErrors.paymentDate = "Enter a valid payment date.";
    } else if (paymentDate > today) {
      fieldErrors.paymentDate = "Payment date cannot be in the future.";
    }
  }

  if (Object.keys(fieldErrors).length) {
    throw new PaymentValidationError(fieldErrors);
  }

  return {
    amountCents: input.amountCents,
    paymentDate,
  };
}
