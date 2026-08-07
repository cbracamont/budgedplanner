import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActiveProfile } from "@/hooks/useFinancialProfiles";
import { endOfMonth, startOfMonth, format } from "date-fns";

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string | null;
}

export interface CategoryBudget {
  id: string;
  category_id: string | null;
  month_year: string;
  limit_amount: number;
}

/** Categories used to classify variable expenses. */
export const useExpenseCategories = () => {
  return useQuery({
    queryKey: ["variable_expense_categories"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as ExpenseCategory[];
      const { data, error } = await supabase
        .from("variable_expense_categories")
        .select("id, name, icon")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExpenseCategory[];
    },
  });
};

export const useAddExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Category name is required");
      if (trimmed.length > 60) throw new Error("Category name must be 60 characters or less");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("variable_expense_categories")
        .insert([{ user_id: user.id, name: trimmed }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variable_expense_categories"] });
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
};

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("variable_expense_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variable_expense_categories"] });
      queryClient.invalidateQueries({ queryKey: ["category_budgets"] });
      queryClient.invalidateQueries({ queryKey: ["variable_expenses"] });
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
};

const monthKey = (month: Date) => format(startOfMonth(month), "yyyy-MM-dd");

/** Budget limits for a given month, scoped to the active financial profile. */
export const useCategoryBudgets = (month: Date) => {
  const { data: activeProfile } = useActiveProfile();
  const key = monthKey(month);

  return useQuery({
    queryKey: ["category_budgets", activeProfile?.id ?? null, key],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as CategoryBudget[];
      let query = supabase
        .from("category_budgets")
        .select("id, category_id, month_year, limit_amount")
        .eq("month_year", key);
      if (activeProfile?.id) query = query.eq("profile_id", activeProfile.id);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((b: any) => ({ ...b, limit_amount: Number(b.limit_amount) })) as CategoryBudget[];
    },
  });
};

/** Create or update the limit for one category in one month. */
export const useSaveCategoryBudget = (month: Date) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: activeProfile } = useActiveProfile();
  const key = monthKey(month);

  return useMutation({
    mutationFn: async ({
      categoryId,
      limitAmount,
      existingId,
    }: { categoryId: string; limitAmount: number; existingId?: string }) => {
      if (!Number.isFinite(limitAmount) || limitAmount < 0) throw new Error("Limit must be a positive number");
      if (limitAmount > 100_000_000) throw new Error("Limit is too large");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (existingId) {
        const { error } = await supabase
          .from("category_budgets")
          .update({ limit_amount: limitAmount })
          .eq("id", existingId);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("category_budgets").insert([{
        user_id: user.id,
        profile_id: activeProfile?.id ?? null,
        category_id: categoryId,
        month_year: key,
        limit_amount: limitAmount,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category_budgets"] });
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
};

export const useDeleteCategoryBudget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("category_budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category_budgets"] });
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
};

/**
 * Copy every limit from the previous month into the selected month.
 * Existing limits in the target month are left untouched.
 */
export const useCopyBudgetsFromPreviousMonth = (month: Date) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: activeProfile } = useActiveProfile();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const target = startOfMonth(month);
      const previous = new Date(target.getFullYear(), target.getMonth() - 1, 1);
      const previousKey = format(previous, "yyyy-MM-dd");
      const targetKey = format(target, "yyyy-MM-dd");

      const scoped = (q: any) => (activeProfile?.id ? q.eq("profile_id", activeProfile.id) : q);

      const [{ data: prevRows, error: prevError }, { data: currentRows, error: currentError }] = await Promise.all([
        scoped(supabase.from("category_budgets").select("category_id, limit_amount").eq("month_year", previousKey)),
        scoped(supabase.from("category_budgets").select("category_id").eq("month_year", targetKey)),
      ]);
      if (prevError) throw prevError;
      if (currentError) throw currentError;

      const taken = new Set((currentRows ?? []).map((r: any) => r.category_id));
      const rows = (prevRows ?? [])
        .filter((r: any) => !taken.has(r.category_id))
        .map((r: any) => ({
          user_id: user.id,
          profile_id: activeProfile?.id ?? null,
          category_id: r.category_id,
          month_year: targetKey,
          limit_amount: Number(r.limit_amount),
        }));

      if (rows.length === 0) return 0;
      const { error } = await supabase.from("category_budgets").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["category_budgets"] });
      if (count === 0) toast({ title: "Nothing to copy", description: "No limits found in the previous month." });
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
};

/** Spend per category for the selected month, derived from variable expenses. */
export const useCategorySpending = (month: Date) => {
  const { data: activeProfile } = useActiveProfile();
  const start = format(startOfMonth(month), "yyyy-MM-dd");
  const end = format(endOfMonth(month), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["category_spending", activeProfile?.id ?? null, start],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { byCategory: {} as Record<string, number>, uncategorized: 0, total: 0 };
      let query = supabase
        .from("variable_expenses")
        .select("amount, category_id, date")
        .eq("user_id", user.id)
        .gte("date", start)
        .lte("date", end);
      if (activeProfile?.id) query = query.eq("profile_id", activeProfile.id);
      const { data, error } = await query;
      if (error) throw error;

      const byCategory: Record<string, number> = {};
      let uncategorized = 0;
      let total = 0;
      for (const row of data ?? []) {
        const amount = Number((row as any).amount ?? 0);
        total += amount;
        const categoryId = (row as any).category_id as string | null;
        if (categoryId) byCategory[categoryId] = (byCategory[categoryId] ?? 0) + amount;
        else uncategorized += amount;
      }
      return { byCategory, uncategorized, total };
    },
  });
};
