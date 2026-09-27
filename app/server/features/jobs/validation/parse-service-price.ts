export type ParseServicePriceResult =
  | {
      success: true;
      value: number | null;
    }
  | {
      success: false;
      error: string;
    };

export function parseServicePrice(value: string): ParseServicePriceResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      success: true,
      value: null,
    };
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return {
      success: false,
      error: "Enter a valid service price.",
    };
  }

  const [dollars, cents = ""] = trimmed.split(".");
  const wholeDollars = Number(dollars);

  if (!Number.isSafeInteger(wholeDollars)) {
    return {
      success: false,
      error: "Enter a smaller service price.",
    };
  }

  const fractionalCents = Number(cents.padEnd(2, "0"));
  const servicePriceCents = wholeDollars * 100 + fractionalCents;

  if (!Number.isSafeInteger(servicePriceCents)) {
    return {
      success: false,
      error: "Enter a smaller service price.",
    };
  }

  return {
    success: true,
    value: servicePriceCents,
  };
}
