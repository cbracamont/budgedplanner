import { describe, it, expect, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { OverviewSummaryCards } from "./OverviewSummaryCards";
import { ExpenseBreakdownCard, type PieDatum } from "./ExpenseBreakdownCard";
import { PaymentTimelineCard } from "./PaymentTimelineCard";
import { formatCurrency, setActiveCurrency, getActiveCurrency } from "@/lib/i18n";
import type { CalendarEvent } from "@/lib/calendarEvents";

const original = getActiveCurrency();
afterEach(() => setActiveCurrency(original));

const summaryLabels = {
  totalIncome: "Total Income",
  totalExpenses: "Total Expenses",
  cashFlow: "Cash Flow",
  totalSavings: "Total Savings",
  variable: "Variable",
  emergency: "Emergency",
  general: "General",
  goals: "Goals",
};

// Raw figures the dashboard computes for the current month
const fixedThisMonth = 1200.5;
const variableThisMonth = 480.25;
const debtThisMonth = 319.25;
const totalIncome = 4000;
const totalVariableIncome = 500;
const totalExpenses = fixedThisMonth + variableThisMonth + debtThisMonth;
const cashFlow = totalIncome + totalVariableIncome - totalExpenses;
const emergencyFund = 5000;
const generalSavings = 3000.75;
const goalsSaved = 1000.25;
const savingsTotal = emergencyFund + generalSavings + goalsSaved;

const summaryTotals = {
  totalIncome,
  totalVariableIncome,
  totalExpenses,
  cashFlow,
  savingsTotal,
  emergencyFund,
  generalSavings,
  goalsSaved,
};

const breakdownLabels = {
  title: "Spending Breakdown",
  subtitle: "This month",
  monthlyTotal: "Monthly total",
  monthly: "monthly",
  ofIncome: "of income",
  high: "High",
  medium: "Medium",
  low: "Low",
  impact: "impact",
};

const pieData: PieDatum[] = [
  { name: "Fixed", value: fixedThisMonth, color: "#ef4444" },
  { name: "Variable", value: variableThisMonth, color: "#22c55e" },
  { name: "Debt", value: debtThisMonth, color: "#3b82f6" },
];

const timelineLabels = {
  previous: "Previous",
  next: "Next",
  empty: "No payments this week",
  paid: "Paid",
  today: "Today",
  recurring: "Recurring",
};

const isoDay = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const currencies = ["GBP", "EUR", "USD", "BRL", "COP"] as const;

/** Intl uses NBSP/narrow-NBSP between symbol and digits; normalise before comparing DOM text. */
const norm = (s: string) => s.replace(/[\s\u00a0\u202f]+/g, " ");
const money = (value: number, currency: string) => norm(formatCurrency(value, currency));
const occurrences = (container: HTMLElement, needle: string) =>
  norm(container.textContent ?? "").split(needle).length - 1;
const expectMoney = (container: HTMLElement, value: number, currency: string) =>
  expect(occurrences(container, money(value, currency))).toBeGreaterThan(0);

describe("dashboard card amounts respect the active currency", () => {
  it.each(currencies)("OverviewSummaryCards renders computed totals in %s", (currency) => {
    setActiveCurrency(currency);
    const { container } = render(<OverviewSummaryCards {...summaryTotals} labels={summaryLabels} />);

    // Rendered strings must equal formatCurrency() of the computed values
    expectMoney(container, totalIncome, currency);
    expectMoney(container, totalExpenses, currency);
    expectMoney(container, cashFlow, currency);
    expectMoney(container, savingsTotal, currency);
    const text = norm(container.textContent ?? "");
    expect(text).toContain(`${summaryLabels.variable}: ${money(totalVariableIncome, currency)}`);
    expect(text).toContain(`${summaryLabels.emergency}: ${money(emergencyFund, currency)}`);
    expect(text).toContain(`${summaryLabels.general}: ${money(generalSavings, currency)}`);
    expect(text).toContain(`${summaryLabels.goals}: ${money(goalsSaved, currency)}`);
  });

  it("OverviewSummaryCards never renders a stale GBP amount after a currency change", () => {
    setActiveCurrency("USD");
    const { container } = render(<OverviewSummaryCards {...summaryTotals} labels={summaryLabels} />);
    expect(container.textContent).not.toContain("£");
    expect(container.textContent).toContain(formatCurrency(cashFlow, "USD"));
  });

  it.each(currencies)("ExpenseBreakdownCard total equals the sum of its slices in %s", (currency) => {
    setActiveCurrency(currency);
    const { container } = render(
      <ExpenseBreakdownCard
        pieData={pieData}
        totalExpenses={totalExpenses}
        totalIncome={totalIncome}
        labels={breakdownLabels}
      />,
    );

    const sumOfSlices = pieData.reduce((s, d) => s + d.value, 0);
    expect(sumOfSlices).toBeCloseTo(totalExpenses, 2);
    // The donut centre and the footer both show the month total
    expect(occurrences(container, money(sumOfSlices, currency))).toBe(2);
    for (const d of pieData) {
      expectMoney(container, d.value, currency);
    }
  });

  it.each(currencies)("PaymentTimelineCard renders each event amount in %s", (currency) => {
    setActiveCurrency(currency);
    const events: CalendarEvent[] = [
      { id: "f1", date: isoDay(0), name: "Rent", amount: 900.9, type: "fixed", recurring: true, payment_status: "pending" },
      { id: "i1", date: isoDay(0), name: "Salary", amount: 2000.1, type: "income", recurring: true, payment_status: "paid" },
      { id: "d1", date: isoDay(0), name: "Card payment", amount: 150.55, type: "debt", recurring: true },
    ];

    const { container } = render(
      <PaymentTimelineCard
        title="Payment Timeline"
        events={events}
        weekOffset={0}
        onPrevWeek={() => {}}
        onNextWeek={() => {}}
        labels={timelineLabels}
      />,
    );

    for (const e of events) {
      expectMoney(container, e.amount, currency);
    }
  });
});
