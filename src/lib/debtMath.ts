/**
 * Shared debt math so every screen (priority list, advisor, charts, forms)
 * uses the same interest rules.
 *
 * Rules:
 * - A debt with a promotional APR uses that rate only until (and including)
 *   its promotional end date; afterwards the regular APR applies.
 * - Monthly interest is APR / 12 applied to the outstanding balance.
 * - Installment plans are interest free: the balance is split into equal
 *   instalments and the final one absorbs the rounding remainder.
 */

import { parseLocalDate } from "@/lib/dateUtils";

export interface DebtRateLike {
  apr?: number | null;
  promotional_apr?: number | null;
  promotional_apr_end_date?: string | null;
  regular_apr?: number | null;
  is_installment?: boolean | null;
}

const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** The APR that actually applies to a debt at a given date (promo aware). */
export const effectiveApr = (debt: DebtRateLike, at: Date = new Date()): number => {
  if (debt.is_installment) return 0;

  const promo = num(debt.promotional_apr);
  const endRaw = debt.promotional_apr_end_date;

  if (endRaw) {
    const end = parseLocalDate(endRaw);
    if (at <= end) return promo;
    const regular = num(debt.regular_apr);
    return regular > 0 ? regular : num(debt.apr);
  }

  return num(debt.apr);
};

export type PromoStatus = "none" | "active" | "expired";

/** Whether a promotional rate exists and if it is still running. */
export const promoStatus = (debt: DebtRateLike, at: Date = new Date()): PromoStatus => {
  if (!debt.promotional_apr_end_date) return "none";
  return at <= parseLocalDate(debt.promotional_apr_end_date) ? "active" : "expired";
};

/** Whole months from `at` until the promo rate ends (0 when it ends this month). */
export const monthsUntilPromoEnds = (debt: DebtRateLike, at: Date = new Date()): number | null => {
  if (promoStatus(debt, at) !== "active") return null;
  const end = parseLocalDate(debt.promotional_apr_end_date as string);
  return (end.getFullYear() - at.getFullYear()) * 12 + (end.getMonth() - at.getMonth());
};

/** Interest charged on `balance` for one month at `apr` (percent per year). */
export const monthlyInterest = (balance: number, apr: number): number =>
  Math.max(0, num(balance)) * (num(apr) / 100 / 12);

/**
 * A payment plan is only viable when the payment beats the first month of
 * interest — otherwise the balance grows forever.
 */
export const paymentCoversInterest = (balance: number, payment: number, apr: number): boolean =>
  num(payment) > monthlyInterest(balance, apr) + 0.005;

/** Minimum monthly payment that would keep the balance from growing. */
export const interestOnlyPayment = (balance: number, apr: number): number =>
  Math.ceil(monthlyInterest(balance, apr) * 100) / 100;

/** Equal instalments with the rounding remainder pushed into the last one. */
export const installmentBreakdown = (total: number, count: number) => {
  const safeTotal = Math.round(num(total) * 100) / 100;
  const n = Math.max(1, Math.floor(num(count)));
  const regular = Math.round((safeTotal / n) * 100) / 100;
  const final = Math.round((safeTotal - regular * (n - 1)) * 100) / 100;
  return { regular, final, count: n, total: safeTotal };
};

/** Add whole months to a date without drifting past month ends. */
export const addMonthsSafe = (date: Date, months: number): Date => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), daysInTarget));
  return target;
};
