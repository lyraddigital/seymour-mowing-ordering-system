export const convertFromISOToShortDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString();
};
