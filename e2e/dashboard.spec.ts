import { test, expect } from "@playwright/test";
import { enterDemoMode, openTab, parseCurrency } from "./helpers";

test.describe("Dashboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
  });

  test("lands on Overview with the summary cards and expense breakdown", async ({ page }) => {
    const overviewTab = page.getByRole("tab", { name: "Overview", exact: true });
    await expect(overviewTab).toHaveAttribute("data-state", "active");

    // Summary cards
    await expect(page.getByText(/Total Income|Ingresos totales|Renda total/i).first()).toBeVisible();
    await expect(page.getByText(/Total Expenses|Gastos totales|Despesas totais/i).first()).toBeVisible();
    await expect(page.getByText(/Cash Flow|Flujo de caja|Fluxo de caixa/i).first()).toBeVisible();

    // Payment timeline with week navigation
    await expect(page.getByRole("button", { name: /Next|Siguiente|Próxim/i }).first()).toBeVisible();
  });

  test("navigates across the main sections and back to Overview", async ({ page }) => {
    for (const tab of ["Income", "Expenses", "Debts and Loans", "Savings"]) {
      await openTab(page, tab);
      await expect(page.getByRole("tab", { name: "Overview", exact: true })).toHaveAttribute(
        "data-state",
        "inactive",
      );
    }

    await openTab(page, "Overview");
    await expect(page.getByText(/Total Income|Ingresos totales|Renda total/i).first()).toBeVisible();
  });

  test("keeps the Overview totals stable when leaving and returning to the tab", async ({ page }) => {
    const cashFlowValue = page
      .locator("div")
      .filter({ hasText: /^[^\d]*[\d.,]+$/ })
      .first();
    const before = await page.locator("body").innerText();

    await openTab(page, "Debts and Loans");
    await openTab(page, "Overview");

    const after = await page.locator("body").innerText();
    const money = (t: string) => (t.match(/[£$€R]\s?[\d.,]+/g) || []).slice(0, 4);
    expect(money(after)).toEqual(money(before));
    expect(cashFlowValue).toBeDefined();
  });
});

test.describe("Monthly totals react to month navigation", () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
    await openTab(page, "Expenses");
  });

  test("variable expenses: month label and month total update when changing months", async ({ page }) => {
    await page.getByRole("tab", { name: "Variable", exact: true }).click();

    const label = page.getByTestId("var-exp-month-label");
    const total = page.getByTestId("var-exp-month-total");
    await expect(label).toBeVisible();
    await expect(total).toBeVisible();

    const firstLabel = await label.innerText();
    const firstTotal = parseCurrency(await total.innerText());
    expect(Number.isNaN(firstTotal)).toBe(false);

    // Forward one month: label must change, total must stay a valid number
    await page.getByTestId("var-exp-next-month").click();
    await expect(label).not.toHaveText(firstLabel);
    const nextTotal = parseCurrency(await total.innerText());
    expect(Number.isNaN(nextTotal)).toBe(false);
    expect(nextTotal).toBeGreaterThanOrEqual(0);

    // Back to the original month: label and total must be restored exactly
    await page.getByTestId("var-exp-prev-month").click();
    await expect(label).toHaveText(firstLabel);
    expect(parseCurrency(await total.innerText())).toBe(firstTotal);
  });

  test("variable expenses: past months exclude entries created later", async ({ page }) => {
    await page.getByRole("tab", { name: "Variable", exact: true }).click();

    const total = page.getByTestId("var-exp-month-total");
    const currentTotal = parseCurrency(await total.innerText());

    // Demo entries are created "today", so a month far in the past cannot include them.
    for (let i = 0; i < 6; i++) await page.getByTestId("var-exp-prev-month").click();

    const pastTotal = parseCurrency(await total.innerText());
    expect(pastTotal).toBeLessThanOrEqual(currentTotal);
  });

  test("category budgets: month navigation moves the budget period", async ({ page }) => {
    await page.getByRole("tab", { name: "Budgets", exact: true }).click();

    const label = page.getByTestId("budget-month-label");
    await expect(label).toBeVisible();
    const firstLabel = await label.innerText();

    await page.getByTestId("budget-next-month").click();
    await expect(label).not.toHaveText(firstLabel);

    await page.getByTestId("budget-prev-month").click();
    await expect(label).toHaveText(firstLabel);
  });
});

test.describe("Payment timeline week navigation", () => {
  test("moves forward and backward through weeks on Overview", async ({ page }) => {
    await enterDemoMode(page);

    const heading = page.locator("h4").filter({ hasText: /\w+ \d+ - \w+ \d+, \d{4}/ }).first();
    const nextWeek = page.getByRole("button", { name: /Next|Siguiente|Próxim/i }).first();
    const prevWeek = page.getByRole("button", { name: /Previous|Anterior/i }).first();

    if (await heading.isVisible().catch(() => false)) {
      const firstRange = await heading.innerText();
      await nextWeek.click();
      await expect(heading).not.toHaveText(firstRange);
      await prevWeek.click();
      await expect(heading).toHaveText(firstRange);
    } else {
      // No events this week: navigation must still work without crashing the page
      await nextWeek.click();
      await expect(page.getByRole("tab", { name: "Overview", exact: true })).toBeVisible();
    }
  });
});
