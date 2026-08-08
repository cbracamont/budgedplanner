import { Page, expect } from "@playwright/test";

/**
 * Enters the app through guest/demo mode so E2E runs need no real account.
 * The flag is seeded before the first script runs (the demo dataset seeds itself
 * on first read), which avoids the click + full page reload race.
 */
export async function enterDemoMode(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("guest-mode-enabled", "true");
      // Skip the first-run walkthrough so it never covers the dashboard.
      localStorage.setItem("hasSeenOnboarding", "true");
    } catch {
      /* ignore */
    }
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });

  const demoButton = page.getByRole("button", { name: /Explore with demo data/i });
  if (await demoButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await demoButton.click();
  }

  await expect(page.getByRole("tab", { name: "Overview", exact: true })).toBeVisible({ timeout: 30_000 });
}

export async function openTab(page: Page, name: string) {
  const tab = page.getByRole("tab", { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute("data-state", "active");
}

/** "£1,234.56" -> 1234.56 (locale-agnostic enough for the currencies in use). */
export function parseCurrency(text: string | null): number {
  if (!text) return NaN;
  const cleaned = text.replace(/[^\d,.-]/g, "");
  // Assume a trailing separator followed by exactly 2 digits is the decimal one.
  const normalized = /[.,]\d{2}$/.test(cleaned)
    ? cleaned.slice(0, -3).replace(/[.,]/g, "") + "." + cleaned.slice(-2)
    : cleaned.replace(/[.,]/g, "");
  return Number(normalized);
}
