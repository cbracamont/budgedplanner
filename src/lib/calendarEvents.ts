import { format } from "date-fns";

export type CalendarEvent = {
  id: string;
  date: string;
  type: "income" | "fixed" | "debt" | "variable";
  name: string;
  amount: number;
  recurring: boolean;
  payment_status?: "paid" | "pending";
};

type IncomeLike = { id: string; name: string; amount: number; payment_day?: number | null };
type VariableIncomeLike = IncomeLike & { frequency?: string | null; day_of_week?: number | null };
type FixedExpenseLike = {
  id: string;
  name: string;
  amount: number;
  payment_day?: number | null;
  payment_month?: number | null;
  frequency_type?: string | null;
};
type DebtLike = { id: string; name: string; minimum_payment: number };
type VariableExpenseLike = { id: string; name: string | null; amount: number };

export interface BuildCalendarEventsInput {
  incomeData: IncomeLike[];
  variableIncomeData: VariableIncomeLike[];
  fixedExpensesData: FixedExpenseLike[];
  debtData: DebtLike[];
  variableExpensesData: VariableExpenseLike[];
  /** First year to generate (inclusive). */
  startYear: number;
  /** Last year to generate (inclusive). */
  endYear: number;
}

const dayInMonth = (year: number, month: number, day: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
};

const isFixedDueInMonth = (exp: FixedExpenseLike, monthNum: number) => {
  const firstMonth = exp.payment_month || 1;
  switch (exp.frequency_type) {
    case "quarterly":
      return [0, 3, 6, 9].some((o) => ((firstMonth + o - 1) % 12) + 1 === monthNum);
    case "semiannual":
      return [0, 6].some((o) => ((firstMonth + o - 1) % 12) + 1 === monthNum);
    case "annual":
    case "annually":
      return firstMonth === monthNum;
    default:
      return true;
  }
};

const isVariableIncomeDueInMonth = (frequency: string | null | undefined, monthIndex: number) => {
  switch (frequency) {
    case "quarterly":
      return monthIndex % 3 === 0;
    case "semi-annually":
      return monthIndex % 6 === 0;
    case "annually":
      return monthIndex === 0;
    default:
      return true;
  }
};

/**
 * Builds the recurring calendar events for the requested year range.
 * Pure function so it can be memoized outside of React render logic.
 */
export const buildCalendarEvents = ({
  incomeData,
  variableIncomeData,
  fixedExpensesData,
  debtData,
  variableExpensesData,
  startYear,
  endYear,
}: BuildCalendarEventsInput): CalendarEvent[] => {
  const events: CalendarEvent[] = [];

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const monthNum = month + 1;

      // Fixed income (payment_day)
      incomeData.forEach((inc) => {
        const date = dayInMonth(year, month, inc.payment_day || 1);
        events.push({
          id: `inc-${inc.id}-${year}-${month}`,
          date: format(date, "yyyy-MM-dd"),
          type: "income",
          name: inc.name,
          amount: inc.amount,
          recurring: true,
        });
      });

      // Variable income
      variableIncomeData.forEach((inc) => {
        if (inc.frequency === "weekly" && inc.day_of_week !== undefined && inc.day_of_week !== null) {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (date.getDay() === inc.day_of_week) {
              events.push({
                id: `var-inc-${inc.id}-${year}-${month}-${day}`,
                date: format(date, "yyyy-MM-dd"),
                type: "income",
                name: `${inc.name} (weekly)`,
                amount: inc.amount,
                recurring: true,
              });
            }
          }
          return;
        }

        if (isVariableIncomeDueInMonth(inc.frequency, month)) {
          const date = dayInMonth(year, month, inc.payment_day || 1);
          events.push({
            id: `var-inc-${inc.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "income",
            name: `${inc.name} (${inc.frequency})`,
            amount: inc.amount,
            recurring: true,
          });
        }
      });

      // Fixed expenses (respect frequency)
      fixedExpensesData.forEach((exp) => {
        if (!isFixedDueInMonth(exp, monthNum)) return;
        const date = dayInMonth(year, month, exp.payment_day || 1);
        events.push({
          id: `fix-${exp.id}-${year}-${month}`,
          date: format(date, "yyyy-MM-dd"),
          type: "fixed",
          name: exp.name,
          amount: exp.amount,
          recurring: exp.frequency_type === "monthly",
        });
      });

      // Debts: day 15
      debtData.forEach((debt) => {
        const date = new Date(year, month, 15);
        events.push({
          id: `debt-${debt.id}-${year}-${month}`,
          date: format(date, "yyyy-MM-dd"),
          type: "debt",
          name: `${debt.name} (min)`,
          amount: debt.minimum_payment,
          recurring: true,
        });
      });

      // Variable expenses: day 10
      variableExpensesData.forEach((exp) => {
        const date = new Date(year, month, 10);
        events.push({
          id: `var-${exp.id}-${year}-${month}`,
          date: format(date, "yyyy-MM-dd"),
          type: "variable",
          name: exp.name || "",
          amount: exp.amount,
          recurring: true,
        });
      });
    }
  }

  return events;
};
