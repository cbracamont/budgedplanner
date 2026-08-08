import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExpenseBreakdownCard, type PieDatum } from "./ExpenseBreakdownCard";
import { formatCurrency } from "@/lib/i18n";

const labels = {
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

// Month-filtered slices, as computed in Index.tsx for the current month
const pieData: PieDatum[] = [
  { name: "Fixed", value: 1200, color: "#f00" },
  { name: "Variable", value: 500, color: "#0f0" },
  { name: "Debt", value: 300, color: "#00f" },
];
const totalExpenses = 2000;
const totalIncome = 4000;

describe("ExpenseBreakdownCard", () => {
  it("renders nothing when there is no month data", () => {
    const { container } = render(
      <ExpenseBreakdownCard pieData={[]} totalExpenses={0} totalIncome={0} labels={labels} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows each slice with its share of the month total", () => {
    render(
      <ExpenseBreakdownCard
        pieData={pieData}
        totalExpenses={totalExpenses}
        totalIncome={totalIncome}
        labels={labels}
      />,
    );

    expect(screen.getByText("Fixed")).toBeInTheDocument();
    expect(screen.getByText("60.0%")).toBeInTheDocument(); // 1200 / 2000
    expect(screen.getByText("25.0%")).toBeInTheDocument(); // 500 / 2000
    expect(screen.getByText("15.0%")).toBeInTheDocument(); // 300 / 2000
    expect(screen.getByText(formatCurrency(1200))).toBeInTheDocument();
  });

  it("labels impact by share of the month total", () => {
    render(
      <ExpenseBreakdownCard
        pieData={pieData}
        totalExpenses={totalExpenses}
        totalIncome={totalIncome}
        labels={labels}
      />,
    );

    // Fixed 60% and Variable 25% are both above the 20% "high" threshold
    expect(screen.getAllByText(`${labels.high} ${labels.impact}`)).toHaveLength(2);
    expect(screen.getAllByText(`${labels.medium} ${labels.impact}`)).toHaveLength(1); // Debt 15%
    expect(screen.queryByText(`${labels.low} ${labels.impact}`)).not.toBeInTheDocument();
  });

  it("expresses the month total as a percentage of income", () => {
    render(
      <ExpenseBreakdownCard
        pieData={pieData}
        totalExpenses={totalExpenses}
        totalIncome={totalIncome}
        labels={labels}
      />,
    );
    expect(screen.getByText(`50% ${labels.ofIncome}`)).toBeInTheDocument();
  });

  it("avoids dividing by zero when there is no income", () => {
    render(<ExpenseBreakdownCard pieData={pieData} totalExpenses={totalExpenses} totalIncome={0} labels={labels} />);
    expect(screen.getByText(`0% ${labels.ofIncome}`)).toBeInTheDocument();
    expect(screen.getAllByText(formatCurrency(totalExpenses)).length).toBeGreaterThan(0);
  });
});
