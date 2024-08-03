export const numberOrText = (
  someNumber: number | undefined,
  text: string
): string => {
  return someNumber?.toString() || text;
};
