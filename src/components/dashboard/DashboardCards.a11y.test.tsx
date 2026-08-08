import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { OverviewSummaryCards } from "./OverviewSummaryCards";
import { ExpenseBreakdownCard, type PieDatum } from "./ExpenseBreakdownCard";
import { PaymentTimelineCard } from "./PaymentTimelineCard";
import { expectNoAxeViolations } from "@/test/axe";
import type { CalendarEvent } from "@/lib/calendarEvents";

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

const summaryTotals = {
  totalIncome: 4000,
  totalVariableIncome: 500,
  totalExpenses: 2500,
  cashFlow: 1500,
  savingsTotal: 9000,
  emergencyFund: 5000,
  generalSavings: 3000,
  goalsSaved: 1000,
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
  { name: "Fixed", value: 1200, color: "#ef4444" },
  { name: "Variable", value: 500, color: "#22c55e" },
  { name: "Debt", value: 300, color: "#3b82f6" },
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

const events: CalendarEvent[] = [
  { id: "f1", date: isoDay(1), name: "Rent", amount: 900, type: "fixed", recurring: true, payment_status: "pending" },
  { id: "i1", date: isoDay(2), name: "Salary", amount: 2000, type: "income", recurring: true, payment_status: "paid" },
  { id: "d1", date: isoDay(3), name: "Card payment", amount: 150, type: "debt", recurring: true },
];

describe("dashboard cards accessibility (axe)", () => {
  it("OverviewSummaryCards has no axe violations", async () => {
    const { container } = render(<OverviewSummaryCards {...summaryTotals} labels={summaryLabels} />);
    await expectNoAxeViolations(container);
  });

  it("OverviewSummaryCards has no axe violations in a negative cash flow state", async () => {
    const { container } = render(
      <OverviewSummaryCards {...summaryTotals} cashFlow={-800} labels={summaryLabels} />,
    );
    await expectNoAxeViolations(container);
  });

  it("ExpenseBreakdownCard has no axe violations", async () => {
    const { container } = render(
      <ExpenseBreakdownCard
        pieData={pieData}
        totalExpenses={2000}
        totalIncome={4000}
        labels={breakdownLabels}
      />,
    );
    await expectNoAxeViolations(container);
  });

  it("PaymentTimelineCard has no axe violations with events", async () => {
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
    await expectNoAxeViolations(container);
  });

  it("PaymentTimelineCard has no axe violations in its empty state", async () => {
    const { container } = render(
      <PaymentTimelineCard
        title="Payment Timeline"
        events={[]}
        weekOffset={4}
        onPrevWeek={() => {}}
        onNextWeek={() => {}}
        labels={timelineLabels}
      />,
    );
    await expectNoAxeViolations(container);
  });
});
