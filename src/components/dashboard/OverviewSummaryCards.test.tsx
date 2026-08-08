import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverviewSummaryCards } from "./OverviewSummaryCards";
import { formatCurrency } from "@/lib/i18n";

const labels = {
  totalIncome: "Total Income",
  totalExpenses: "Total Expenses",
  cashFlow: "Cash Flow",
  totalSavings: "Total Savings",
  variable: "Variable",
  emergency: "Emergency",
  general: "General",
  goals: "Goals",
};

// Totals as they arrive from Index.tsx: expenses are the CURRENT MONTH figures
const currentMonth = {
  totalIncome: 4000,
  totalVariableIncome: 500,
  totalExpenses: 2500, // fixed due this month + current month variable expenses
  cashFlow: 1500,
  savingsTotal: 9000,
  emergencyFund: 5000,
  generalSavings: 3000,
  goalsSaved: 1000,
};

describe("OverviewSummaryCards", () => {
  it("renders the month-filtered totals it receives", () => {
    render(<OverviewSummaryCards {...currentMonth} labels={labels} />);

    expect(screen.getByText(labels.totalIncome)).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(4000))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(2500))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(1500))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(9000))).toBeInTheDocument();
    expect(screen.getByText(`${labels.variable}: ${formatCurrency(500)}`)).toBeInTheDocument();
    expect(screen.getByText(`${labels.emergency}: ${formatCurrency(5000)}`)).toBeInTheDocument();
  });

  it("does not show the variable income line when there is none", () => {
    render(<OverviewSummaryCards {...currentMonth} totalVariableIncome={0} labels={labels} />);
    expect(screen.queryByText(new RegExp(`^${labels.variable}:`))).not.toBeInTheDocument();
  });

  it("derives the status from cash flow relative to the month's expenses", () => {
    const cases: Array<[number, string]> = [
      [1000, "Excellent"], // > 30% of 2000
      [400, "Strong"], // 10-30%
      [50, "Healthy"], // > 0
      [-100, "Review"], // within -10%
      [-800, "Critical"],
    ];

    for (const [cashFlow, label] of cases) {
      const { unmount } = render(
        <OverviewSummaryCards {...currentMonth} totalExpenses={2000} cashFlow={cashFlow} labels={labels} />,
      );
      expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
      unmount();
    }
  });

  it("shows a zero cash flow as a non-negative (blue) figure", () => {
    render(<OverviewSummaryCards {...currentMonth} cashFlow={0} labels={labels} />);
    const value = screen.getByText(formatCurrency(0));
    expect(value.className).toContain("text-success");
  });
});
