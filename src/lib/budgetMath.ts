/**
 * Shared monthly-budget math so every screen shows the same numbers.
 *
 * Rules mirrored here (single source of truth):
 * - Non-monthly fixed expenses only count in the months they are actually due.
 * - Weekly / bi-weekly fixed expenses are converted to their monthly equivalent.
 */

export type FixedFrequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "semiannual" | "annual" | "annually";

export interface FixedExpenseLike {
  amount: number;
  frequency_type?: string | null;
  payment_month?: number | null;
}

/** Exact monthly-equivalent multipliers (52 weeks / 12 months, etc.). */
export const FIXED_FREQUENCY_MULTIPLIER: Record<string, number> = {
  weekly: 52 / 12,
  "bi-weekly": 26 / 12,
  monthly: 1,
  quarterly: 1,
  semiannual: 1,
  annual: 1,
  annually: 1,
};

/** Does a non-monthly fixed expense fall due in the given month (1-12)? */
export const isFixedExpenseDueInMonth = (exp: FixedExpenseLike, monthNum: number): boolean => {
  const firstMonth = exp.payment_month || 1;
  switch (exp.frequency_type) {
    case "quarterly":
      return [0, 3, 6, 9].some((offset) => ((firstMonth + offset - 1) % 12) + 1 === monthNum);
    case "semiannual":
      return [0, 6].some((offset) => ((firstMonth + offset - 1) % 12) + 1 === monthNum);
    case "annual":
    case "annually":
      return firstMonth === monthNum;
    default:
      return true;
  }
};

/** Amount a fixed expense contributes to the given month's cashflow. */
export const monthlyFixedExpenseAmount = (exp: FixedExpenseLike, monthNum: number): number => {
  if (!isFixedExpenseDueInMonth(exp, monthNum)) return 0;
  const multiplier = FIXED_FREQUENCY_MULTIPLIER[exp.frequency_type ?? "monthly"] ?? 1;
  return (Number(exp.amount) || 0) * multiplier;
};

/** Total monthly cost of a list of fixed expenses for the given month. */
export const sumMonthlyFixedExpenses = (expenses: FixedExpenseLike[], monthNum: number): number =>
  expenses.reduce((sum, exp) => sum + monthlyFixedExpenseAmount(exp, monthNum), 0);
