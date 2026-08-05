import { defineTool } from "@lovable.dev/mcp-js";
import { activeProfile } from "../supabase";

export default defineTool({
  name: "list_savings_goals",
  title: "List savings goals",
  description:
    "List the savings goals on the signed-in user's active budget profile with progress, monthly contribution and target date.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { supabase, profile } = await activeProfile(ctx);
    const { data, error } = await supabase
      .from("savings_goals")
      .select("id, goal_name, goal_description, current_amount, target_amount, monthly_contribution, target_date, is_active")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: true });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const goals = (data ?? []).map((g: any) => ({
      ...g,
      progress_percent:
        Number(g.target_amount) > 0
          ? Math.round((Number(g.current_amount ?? 0) / Number(g.target_amount)) * 100)
          : 0,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(goals, null, 2) }],
      structuredContent: { savings_goals: goals, currency: "GBP" },
    };
  },
});
