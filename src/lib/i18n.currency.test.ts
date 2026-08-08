import { describe, it, expect, afterEach } from "vitest";
import { formatCurrency, setActiveCurrency, getActiveCurrency } from "./i18n";

const original = getActiveCurrency();

afterEach(() => setActiveCurrency(original));

const expected = (amount: number, locale: string, currency: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);

describe("formatCurrency", () => {
  it("defaults to GBP", () => {
    expect(getActiveCurrency()).toBe("GBP");
    expect(formatCurrency(1234.5)).toBe(expected(1234.5, "en-GB", "GBP"));
  });

  it("honours the active currency set from user settings", () => {
    for (const [currency, locale] of [
      ["EUR", "de-DE"],
      ["USD", "en-US"],
      ["BRL", "pt-BR"],
      ["MXN", "es-MX"],
      ["COP", "es-CO"],
    ] as const) {
      setActiveCurrency(currency);
      expect(getActiveCurrency()).toBe(currency);
      expect(formatCurrency(1234.5)).toBe(expected(1234.5, locale, currency));
    }
  });

  it("normalises casing and whitespace, and ignores empty values", () => {
    setActiveCurrency("  usd ");
    expect(getActiveCurrency()).toBe("USD");
    setActiveCurrency("");
    expect(getActiveCurrency()).toBe("USD");
    setActiveCurrency(null);
    expect(getActiveCurrency()).toBe("USD");
  });

  it("lets an explicit currency argument override the active one", () => {
    setActiveCurrency("EUR");
    expect(formatCurrency(99, "USD")).toBe(expected(99, "en-US", "USD"));
    expect(formatCurrency(99)).toBe(expected(99, "de-DE", "EUR"));
  });

  it("always renders two decimals and handles negatives and zero", () => {
    setActiveCurrency("GBP");
    expect(formatCurrency(0)).toBe(expected(0, "en-GB", "GBP"));
    expect(formatCurrency(5)).toContain(".00");
    expect(formatCurrency(-250.4)).toBe(expected(-250.4, "en-GB", "GBP"));
  });

  it("falls back to GBP formatting for an unknown currency code", () => {
    expect(formatCurrency(10, "NOT_A_CURRENCY")).toBe(expected(10, "en-GB", "GBP"));
  });
});
