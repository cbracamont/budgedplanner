import { defineTool } from "@lovable.dev/mcp-js";
import { activeProfile } from "../supabase";

export default defineTool({
  name: "list_debts",
  title: "List debts",
  description:
    "List the debts on the signed-in user's active budget profile with balance, APR, minimum payment and payment day.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { supabase, profile } = await activeProfile(ctx);
    const { data, error } = await supabase
      .from("debts")
      .select("id, name, bank, balance, apr, minimum_payment, payment_day, end_date")
      .eq("profile_id", profile.id)
      .order("balance", { ascending: false });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { debts: data ?? [], currency: "GBP" },
    };
  },
});
