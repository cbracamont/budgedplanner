/**
 * Copies the local demo (guest) data into the real backend for the freshly
 * authenticated user, then clears the local store.
 */
import { supabase } from "@/integrations/supabase/client";
import { clearGuestData, readDB, setPendingMigration } from "./store";

const strip = (row: Record<string, any>) => {
  const { id, created_at, updated_at, user_id, profile_id, household_id, ...rest } = row;
  return rest;
};

const CHILD_TABLES = [
  "income_sources",
  "fixed_expenses",
  "debts",
  "savings",
  "savings_goals",
  "savings_history",
  "variable_income",
  "payment_tracker",
] as const;

export const migrateGuestData = async (): Promise<{ migrated: number }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { migrated: 0 };

  const db = readDB();
  let migrated = 0;

  // 1. Profiles
  const profileMap = new Map<string, string>();
  for (const profile of db.financial_profiles ?? []) {
    const { data, error } = await supabase
      .from("financial_profiles")
      .insert({
        user_id: user.id,
        name: profile.name === "Demo" ? "Personal" : profile.name,
        type: profile.type ?? "individual",
        is_active: true,
      })
      .select("id")
      .single();
    if (error || !data) continue;
    profileMap.set(profile.id, data.id);
    migrated++;
  }
  const firstProfileId = profileMap.values().next().value as string | undefined;
  if (!firstProfileId) {
    clearGuestData();
    setPendingMigration(false);
    return { migrated };
  }

  // 2. Expense categories (not profile scoped)
  const categoryMap = new Map<string, string>();
  for (const category of db.variable_expense_categories ?? []) {
    const { data, error } = await supabase
      .from("variable_expense_categories")
      .insert({ user_id: user.id, name: category.name, icon: category.icon ?? null })
      .select("id")
      .single();
    if (error || !data) continue;
    categoryMap.set(category.id, data.id);
    migrated++;
  }

  // 3. Profile scoped records
  for (const table of CHILD_TABLES) {
    const rows = db[table] ?? [];
    if (!rows.length) continue;
    const payload = rows.map((row) => ({
      ...strip(row),
      user_id: user.id,
      profile_id: profileMap.get(row.profile_id) ?? firstProfileId,
    }));
    const { error } = await supabase.from(table as any).insert(payload as any);
    if (!error) migrated += payload.length;
  }

  // 4. Variable expenses need the remapped category
  const variableExpenses = db.variable_expenses ?? [];
  if (variableExpenses.length) {
    const payload = variableExpenses.map((row) => ({
      ...strip(row),
      user_id: user.id,
      profile_id: profileMap.get(row.profile_id) ?? firstProfileId,
      category_id: row.category_id ? categoryMap.get(row.category_id) ?? null : null,
    }));
    const { error } = await supabase.from("variable_expenses").insert(payload as any);
    if (!error) migrated += payload.length;
  }
  // 5. Category budgets need the remapped category and profile
  const categoryBudgets = db.category_budgets ?? [];
  if (categoryBudgets.length) {
    const payload = categoryBudgets
      .filter((row) => !row.category_id || categoryMap.has(row.category_id))
      .map((row) => ({
        ...strip(row),
        user_id: user.id,
        profile_id: profileMap.get(row.profile_id) ?? firstProfileId,
        category_id: row.category_id ? categoryMap.get(row.category_id) ?? null : null,
      }));
    if (payload.length) {
      const { error } = await supabase.from("category_budgets").insert(payload as any);
      if (!error) migrated += payload.length;
    }
  }


  // Debt payment history is intentionally not copied: demo balances already
  // reflect those payments, and re-inserting them would decrement twice.

  clearGuestData();
  setPendingMigration(false);
  return { migrated };
};
