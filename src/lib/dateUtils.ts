/**
 * Parse a plain "YYYY-MM-DD" database date as a LOCAL date.
 *
 * `new Date("2024-03-01")` is parsed as UTC midnight, which renders as
 * Feb 29 in any negative UTC offset (all of the Americas) and shifts payments
 * into the wrong month at month boundaries.
 */
export const parseLocalDate = (value: string | Date | null | undefined): Date => {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
};
