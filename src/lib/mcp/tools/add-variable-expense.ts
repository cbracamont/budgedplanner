import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { activeProfile } from "../supabase";

export default defineTool({
  name: "add_variable_expense",
  title: "Add variable expense",
  description:
    "Record a one-off variable expense on the signed-in user's active budget profile.",
  inputSchema: {
    name: z.string().trim().min(1).describe("What the expense was for, e.g. 'Groceries'."),
    amount: z.number().positive().describe("Expense amount in GBP."),
    date: z.string().optional().describe("Date of the expense as YYYY-MM-DD. Defaults to today."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, amount, date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ToolError("date must be formatted as YYYY-MM-DD");
    }
    const { supabase, profile } = await activeProfile(ctx);
    const { data, error } = await supabase
      .from("variable_expenses")
      .insert({
        user_id: ctx.getUserId(),
        profile_id: profile.id,
        name,
        amount,
        date: date ?? new Date().toISOString().split("T")[0],
      })
      .select("id, name, amount, date")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: `Added expense "${data.name}" of £${Number(data.amount).toFixed(2)} on ${data.date}.` }],
      structuredContent: { expense: data },
    };
  },
});
