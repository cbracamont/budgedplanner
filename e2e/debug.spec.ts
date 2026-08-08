import { test } from "@playwright/test";
test("debug", async ({ page }) => {
  page.on("console", (m) => console.log("CONSOLE", m.type(), m.text().slice(0, 200)));
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Explore with demo data/i }).click();
  await page.waitForTimeout(5000);
  console.log("GUEST:", await page.evaluate("localStorage.getItem('guest-mode-enabled')"));
  console.log("URL:", page.url());
  console.log((await page.innerText("body")).slice(0, 300));
});
