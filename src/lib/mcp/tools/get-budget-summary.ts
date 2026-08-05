import { defineTool } from "@lovable.dev/mcp-js";
import { activeProfile } from "../supabase";

export default defineTool({
  name: "get_budget_summary",
  title: "Get budget summary",
  description:
    "Summarize the signed-in user's active budget profile: total monthly income, debt minimum payments, fixed and variable expenses, savings balances and the resulting monthly cashflow.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { supabase, profile } = await activeProfile(ctx);
    const now = new Date();
    const month = now.getMonth() + 1;

    const [income, debts, fixed, variable, savings, goals] = await Promise.all([
      supabase.from("income_sources").select("amount, income_type").eq("profile_id", profile.id),
      supabase.from("debts").select("balance, minimum_payment").eq("profile_id", profile.id),
      supabase.from("fixed_expenses").select("amount, frequency_type, payment_month").eq("profile_id", profile.id),
      supabase.from("variable_expenses").select("amount").eq("profile_id", profile.id),
      supabase.from("savings").select("emergency_fund, total_accumulated, monthly_emergency_contribution").eq("profile_id", profile.id).maybeSingle(),
      supabase.from("savings_goals").select("goal_name, current_amount, target_amount, monthly_contribution, is_active").eq("profile_id", profile.id),
    ]);

    const firstError = [income, debts, fixed, variable, savings, goals].find((r) => r.error)?.error;
    if (firstError) return { content: [{ type: "text", text: firstError.message }], isError: true };

    const sum = (rows: any[] | null, key: string) =>
      (rows ?? []).reduce((acc, row) => acc + Number(row[key] ?? 0), 0);

    const totalIncome = sum(income.data as any[], "amount");
    const totalDebtPayments = sum(debts.data as any[], "minimum_payment");
    const debtBalance = sum(debts.data as any[], "balance");
    const totalFixed = (fixed.data ?? []).reduce((acc: number, e: any) => {
      const amount = Number(e.amount ?? 0);
      if (e.frequency_type === "annual") return acc + (e.payment_month === month ? amount : 0);
      return acc + amount;
    }, 0);
    const totalVariable = sum(variable.data as any[], "amount");
    const goalContributions = (goals.data ?? [])
      .filter((g: any) => g.is_active)
      .reduce((acc: number, g: any) => acc + Number(g.monthly_contribution ?? 0), 0);
    const emergencyContribution = Number((savings.data as any)?.monthly_emergency_contribution ?? 0);
    const savingsBalance =
      Number((savings.data as any)?.emergency_fund ?? 0) +
      Number((savings.data as any)?.total_accumulated ?? 0) +
      sum(goals.data as any[], "current_amount");

    const cashflow =
      totalIncome - totalDebtPayments - totalFixed - totalVariable - goalContributions - emergencyContribution;

    const summary = {
      profile: { name: profile.name, type: profile.type },
      monthly_income: totalIncome,
      monthly_debt_minimum_payments: totalDebtPayments,
      total_debt_balance: debtBalance,
      monthly_fixed_expenses: totalFixed,
      monthly_variable_expenses: totalVariable,
      monthly_savings_goal_contributions: goalContributions,
      monthly_emergency_fund_contribution: emergencyContribution,
      total_savings_balance: savingsBalance,
      monthly_cashflow: cashflow,
      currency: "GBP",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
