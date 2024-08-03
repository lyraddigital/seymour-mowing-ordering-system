export const getCurrencyString = (value: number): string | undefined => {
  return value ? `$${value.toFixed(2).toString()}` : undefined;
};
