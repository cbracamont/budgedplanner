import { Page, expect } from "@playwright/test";

/** Enters the app through guest/demo mode so E2E runs need no real account. */
export async function enterDemoMode(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const demoButton = page.getByRole("button", { name: /Explore with demo data/i });
  if (await demoButton.isVisible().catch(() => false)) {
    await demoButton.click();
  }

  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible({ timeout: 30_000 });
}

export async function openTab(page: Page, name: string) {
  await page.getByRole("tab", { name, exact: true }).click();
  await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute("data-state", "active");
}

/** "£1,234.56" -> 1234.56 (locale-agnostic enough for the currencies in use). */
export function parseCurrency(text: string | null): number {
  if (!text) return NaN;
  const cleaned = text.replace(/[^\d,.-]/g, "");
  // Assume the last separator followed by exactly 2 digits is the decimal one.
  const normalized = /[.,]\d{2}$/.test(cleaned)
    ? cleaned.slice(0, -3).replace(/[.,]/g, "") + "." + cleaned.slice(-2)
    : cleaned.replace(/[.,]/g, "");
  return Number(normalized);
}
