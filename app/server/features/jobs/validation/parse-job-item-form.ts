import type { CreateJobItemInput } from "../types/create-job-item-input";

export interface JobItemFormValues {
  description: string;
  quantity: string;
  unitPrice: string;
}

export function parseJobItemForm(
  values: JobItemFormValues,
): CreateJobItemInput {
  const price = values.unitPrice.trim();
  const [dollars, cents = ""] = price.split(".");
  return {
    description: values.description,
    quantity: /^\d+$/.test(values.quantity.trim())
      ? Number(values.quantity)
      : Number.NaN,
    unitPriceCents: /^\d+(?:\.\d{1,2})?$/.test(price)
      ? Number(dollars) * 100 + Number(cents.padEnd(2, "0"))
      : Number.NaN,
  };
}
