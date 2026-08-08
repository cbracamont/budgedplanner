import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SummaryCardsSkeleton, ChartCardSkeleton, ListCardSkeleton } from "./DashboardSkeleton";

const skeletons = (container: HTMLElement) => container.querySelectorAll("[data-slot='skeleton'], .animate-pulse");

describe("dashboard skeletons", () => {
  it("renders a placeholder per metric card plus the status strip", () => {
    const { container } = render(<SummaryCardsSkeleton />);
    expect(container.querySelectorAll("[aria-busy='true']").length).toBeGreaterThan(0);
    expect(skeletons(container).length).toBe(14);
  });

  it("renders the donut placeholder with one row per slice", () => {
    const { container } = render(<ChartCardSkeleton />);
    expect(skeletons(container).length).toBe(6);
  });

  it("renders the default number of list rows", () => {
    const { container } = render(<ListCardSkeleton />);
    expect(skeletons(container).length).toBe(4);
  });

  it("renders a custom number of list rows", () => {
    const { container } = render(<ListCardSkeleton rows={5} />);
    expect(skeletons(container).length).toBe(6);
  });
});
