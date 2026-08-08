import axe, { type AxeResults, type RunOptions } from "axe-core";
import { expect } from "vitest";

/** Rules that cannot be evaluated meaningfully in jsdom (no real layout/painting). */
const JSDOM_UNSUPPORTED = [
  "color-contrast",
  "target-size",
  "region",
  "landmark-one-main",
  "page-has-heading-one",
  "html-has-lang",
  "document-title",
];

const OPTIONS: RunOptions = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
  rules: Object.fromEntries(JSDOM_UNSUPPORTED.map((id) => [id, { enabled: false }])),
};

export const runAxe = (container: HTMLElement): Promise<AxeResults> =>
  axe.run(container, OPTIONS) as unknown as Promise<AxeResults>;

const describeViolations = (results: AxeResults) =>
  results.violations
    .map(
      (v) =>
        `[${v.impact ?? "unknown"}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n  ` +
        v.nodes.map((n) => n.target.join(" ")).join("\n  "),
    )
    .join("\n\n");

/** Fails the test when axe reports any violation in the rendered subtree. */
export const expectNoAxeViolations = async (container: HTMLElement) => {
  const results = await runAxe(container);
  expect(results.violations, `axe found ${results.violations.length} violation(s):\n\n${describeViolations(results)}`)
    .toEqual([]);
};
