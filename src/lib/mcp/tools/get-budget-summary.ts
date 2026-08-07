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
    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().split("T")[0];
    const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0)).toISOString().split("T")[0];

    // Same rule the dashboard uses: non-monthly fixed expenses only count in their due months.
    const isDueThisMonth = (e: any) => {
      const first = Number(e.payment_month || 1);
      switch (e.frequency_type) {
        case "quarterly":
          return [0, 3, 6, 9].some((o) => ((first + o - 1) % 12) + 1 === month);
        case "semiannual":
          return [0, 6].some((o) => ((first + o - 1) % 12) + 1 === month);
        case "annual":
          return first === month;
        default:
          return true;
      }
    };

    const [income, variableIncome, debts, fixed, variable, savings, goals, settings] = await Promise.all([
      supabase.from("income_sources").select("amount").eq("profile_id", profile.id).eq("income_type", "fixed"),
      supabase.from("variable_income").select("amount").eq("profile_id", profile.id).gte("date", monthStart).lte("date", monthEnd),
      supabase.from("debts").select("balance, minimum_payment").eq("profile_id", profile.id),
      supabase.from("fixed_expenses").select("amount, frequency_type, payment_month").eq("profile_id", profile.id),
      // Variable expenses are persistent in this app: they carry over month to month.
      supabase.from("variable_expenses").select("amount").eq("profile_id", profile.id),
      supabase.from("savings").select("emergency_fund, total_accumulated, monthly_emergency_contribution").eq("profile_id", profile.id).maybeSingle(),
      supabase.from("savings_goals").select("goal_name, current_amount, target_amount, monthly_contribution, is_active").eq("profile_id", profile.id),
      supabase.from("user_settings").select("currency").maybeSingle(),
    ]);

    const firstError = [income, variableIncome, debts, fixed, variable, savings, goals].find((r) => r.error)?.error;
    if (firstError) return { content: [{ type: "text", text: firstError.message }], isError: true };

    const sum = (rows: any[] | null, key: string) =>
      (rows ?? []).reduce((acc, row) => acc + Number(row[key] ?? 0), 0);

    const fixedIncome = sum(income.data as any[], "amount");
    const monthVariableIncome = sum(variableIncome.data as any[], "amount");
    const totalIncome = fixedIncome + monthVariableIncome;
    const totalDebtPayments = sum(debts.data as any[], "minimum_payment");
    const debtBalance = sum(debts.data as any[], "balance");
    const totalFixed = (fixed.data ?? [])
      .filter(isDueThisMonth)
      .reduce((acc: number, e: any) => acc + Number(e.amount ?? 0), 0);
    const totalVariable = sum(variable.data as any[], "amount");
    const goalContributions = (goals.data ?? [])
      .filter((g: any) => g.is_active)
      .reduce((acc: number, g: any) => acc + Number(g.monthly_contribution ?? 0), 0);
    const emergencyContribution = Number((savings.data as any)?.monthly_emergency_contribution ?? 0);
    const savingsBalance =
      Number((savings.data as any)?.emergency_fund ?? 0) +
      Number((savings.data as any)?.total_accumulated ?? 0) +
      sum(goals.data as any[], "current_amount");

    // Identical to the dashboard's Cash Flow card (emergency contribution is not deducted there).
    const cashflow = totalIncome - totalDebtPayments - totalFixed - totalVariable - goalContributions;

    const summary = {
      profile: { name: profile.name, type: profile.type },
      monthly_fixed_income: fixedIncome,
      monthly_variable_income: monthVariableIncome,
      monthly_income: totalIncome,
      monthly_debt_minimum_payments: totalDebtPayments,
      total_debt_balance: debtBalance,
      monthly_fixed_expenses: totalFixed,
      monthly_variable_expenses: totalVariable,
      monthly_savings_goal_contributions: goalContributions,
      monthly_emergency_fund_contribution: emergencyContribution,
      total_savings_balance: savingsBalance,
      monthly_cashflow: cashflow,
      currency: (settings.data as any)?.currency ?? "GBP",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
