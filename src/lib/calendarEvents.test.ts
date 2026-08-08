import { describe, it, expect } from "vitest";
import { buildCalendarEvents, type BuildCalendarEventsInput } from "./calendarEvents";

const empty: BuildCalendarEventsInput = {
  incomeData: [],
  variableIncomeData: [],
  fixedExpensesData: [],
  debtData: [],
  variableExpensesData: [],
  startYear: 2026,
  endYear: 2026,
};

describe("buildCalendarEvents", () => {
  it("returns no events when there is no data", () => {
    expect(buildCalendarEvents(empty)).toEqual([]);
  });

  it("generates one monthly income event per month and clamps the payment day to the month length", () => {
    const events = buildCalendarEvents({
      ...empty,
      incomeData: [{ id: "i1", name: "Salary", amount: 3000, payment_day: 31 }],
    });

    expect(events).toHaveLength(12);
    expect(events.every((e) => e.type === "income" && e.recurring && e.amount === 3000)).toBe(true);
    expect(events[0].date).toBe("2026-01-31");
    // February 2026 has 28 days -> clamped
    expect(events[1].date).toBe("2026-02-28");
    expect(events[3].date).toBe("2026-04-30");
  });

  it("respects fixed expense frequency (monthly, quarterly, semiannual, annual)", () => {
    const byName = (name: string, freq: string) => ({
      id: name,
      name,
      amount: 100,
      payment_day: 5,
      payment_month: 1,
      frequency_type: freq,
    });

    const events = buildCalendarEvents({
      ...empty,
      fixedExpensesData: [
        byName("rent", "monthly"),
        byName("water", "quarterly"),
        byName("insurance", "semiannual"),
        byName("tax", "annual"),
      ],
    });

    const count = (name: string) => events.filter((e) => e.name === name).length;
    expect(count("rent")).toBe(12);
    expect(count("water")).toBe(4);
    expect(count("insurance")).toBe(2);
    expect(count("tax")).toBe(1);

    expect(events.find((e) => e.name === "tax")!.date).toBe("2026-01-05");
    expect(events.filter((e) => e.name === "water").map((e) => e.date)).toEqual([
      "2026-01-05",
      "2026-04-05",
      "2026-07-05",
      "2026-10-05",
    ]);
    // only monthly fixed expenses are flagged as recurring
    expect(events.find((e) => e.name === "rent")!.recurring).toBe(true);
    expect(events.find((e) => e.name === "tax")!.recurring).toBe(false);
  });

  it("expands weekly variable income onto every matching weekday", () => {
    const events = buildCalendarEvents({
      ...empty,
      variableIncomeData: [
        { id: "v1", name: "Shifts", amount: 200, frequency: "weekly", day_of_week: 1, payment_day: null },
      ],
      startYear: 2026,
      endYear: 2026,
    });

    const january = events.filter((e) => e.date.startsWith("2026-01"));
    // Mondays in Jan 2026: 5, 12, 19, 26
    expect(january.map((e) => e.date)).toEqual(["2026-01-05", "2026-01-12", "2026-01-19", "2026-01-26"]);
    expect(january[0].name).toBe("Shifts (weekly)");
    expect(events.every((e) => new Date(`${e.date}T00:00:00`).getDay() === 1)).toBe(true);
  });

  it("honours quarterly / semi-annual / annual variable income frequencies", () => {
    const build = (frequency: string) =>
      buildCalendarEvents({
        ...empty,
        variableIncomeData: [{ id: "v", name: "Bonus", amount: 500, frequency, payment_day: 10 }],
      });

    expect(build("quarterly")).toHaveLength(4);
    expect(build("semi-annually")).toHaveLength(2);
    expect(build("annually")).toHaveLength(1);
    expect(build("monthly")).toHaveLength(12);
    expect(build("annually")[0].date).toBe("2026-01-10");
  });

  it("places debts on day 15 and variable expenses on day 10 of each month", () => {
    const events = buildCalendarEvents({
      ...empty,
      debtData: [{ id: "d1", name: "Card", minimum_payment: 50 }],
      variableExpensesData: [{ id: "x1", name: "Groceries", amount: 300 }],
    });

    const debts = events.filter((e) => e.type === "debt");
    const variables = events.filter((e) => e.type === "variable");
    expect(debts).toHaveLength(12);
    expect(variables).toHaveLength(12);
    expect(debts[0]).toMatchObject({ date: "2026-01-15", name: "Card (min)", amount: 50 });
    expect(variables[0]).toMatchObject({ date: "2026-01-10", name: "Groceries", amount: 300 });
  });

  it("covers the full requested year range with unique ids", () => {
    const events = buildCalendarEvents({
      ...empty,
      incomeData: [{ id: "i1", name: "Salary", amount: 1000, payment_day: 1 }],
      startYear: 2025,
      endYear: 2027,
    });

    expect(events).toHaveLength(36);
    expect(new Set(events.map((e) => e.id)).size).toBe(36);
    expect(events[0].date).toBe("2025-01-01");
    expect(events[events.length - 1].date).toBe("2027-12-01");
  });
});
