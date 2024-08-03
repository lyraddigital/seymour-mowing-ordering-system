export const stringOrText = (
  someString: string | undefined,
  text: string
): string => {
  return someString || text;
};
