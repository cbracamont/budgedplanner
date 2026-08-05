import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getBudgetSummary from "./tools/get-budget-summary";
import listDebts from "./tools/list-debts";
import listSavingsGoals from "./tools/list-savings-goals";
import addVariableExpense from "./tools/add-variable-expense";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "budget-planner",
  title: "Budget Planner",
  version: "0.1.0",
  instructions:
    "Tools for Budget Planner, a UK household budgeting app. Use `get_budget_summary` for the signed-in user's monthly income, expenses, savings and cashflow; `list_debts` and `list_savings_goals` for detail; `add_variable_expense` to log a one-off spend. All amounts are in GBP and scoped to the user's active budget profile.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getBudgetSummary, listDebts, listSavingsGoals, addVariableExpense],
});
