/**
 * Local demo ("guest mode") database.
 *
 * Everything lives in localStorage so a visitor can explore the whole app
 * without an account. When they sign up, `migrateGuestData` copies these rows
 * into the real backend under their new user id.
 */

export const GUEST_USER_ID = "11111111-1111-4111-8111-111111111111";
export const GUEST_EMAIL = "guest@demo.local";

const ENABLED_KEY = "guest-mode-enabled";
const DATA_KEY = "guest-demo-db";
const PENDING_KEY = "guest-migrate-pending";

export type GuestRow = Record<string, any>;
export type GuestDB = Record<string, GuestRow[]>;

export const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}-4000-8000-${Math.random()
        .toString(16)
        .slice(2, 14)}`;

const iso = (daysAgo = 0) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

export const isGuestMode = () => {
  try {
    return localStorage.getItem(ENABLED_KEY) === "true";
  } catch {
    return false;
  }
};

export const setGuestMode = (enabled: boolean) => {
  try {
    if (enabled) localStorage.setItem(ENABLED_KEY, "true");
    else localStorage.removeItem(ENABLED_KEY);
  } catch {
    /* ignore */
  }
};

export const hasPendingMigration = () => {
  try {
    return localStorage.getItem(PENDING_KEY) === "true";
  } catch {
    return false;
  }
};

export const setPendingMigration = (pending: boolean) => {
  try {
    if (pending) localStorage.setItem(PENDING_KEY, "true");
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
};

export const clearGuestData = () => {
  try {
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(PENDING_KEY);
    localStorage.removeItem("active-financial-profile-id");
  } catch {
    /* ignore */
  }
};

const base = (extra: GuestRow = {}) => ({
  id: uuid(),
  user_id: GUEST_USER_ID,
  created_at: iso(3),
  updated_at: iso(),
  ...extra,
});

const buildSeed = (): GuestDB => {
  const now = new Date();
  const profileId = uuid();
  const groceriesId = uuid();
  const transportId = uuid();
  const leisureId = uuid();
  const cardDebtId = uuid();

  return {
    financial_profiles: [
      base({
        id: profileId,
        name: "Demo",
        type: "individual",
        is_active: true,
        household_id: null,
      }),
    ],
    income_sources: [
      base({ profile_id: profileId, name: "Salary", amount: 2800, payment_day: 28, frequency: "monthly", income_type: "fixed", day_of_week: null }),
      base({ profile_id: profileId, name: "Freelance", amount: 450, payment_day: 15, frequency: "monthly", income_type: "fixed", day_of_week: null }),
    ],
    fixed_expenses: [
      base({ profile_id: profileId, name: "Rent", amount: 1100, payment_day: 1, frequency: "monthly", frequency_type: "monthly", payment_month: null }),
      base({ profile_id: profileId, name: "Utilities", amount: 145, payment_day: 10, frequency: "monthly", frequency_type: "monthly", payment_month: null }),
      base({ profile_id: profileId, name: "Mobile & Internet", amount: 65, payment_day: 18, frequency: "monthly", frequency_type: "monthly", payment_month: null }),
      base({ profile_id: profileId, name: "Car insurance", amount: 480, payment_day: 5, frequency: "annual", frequency_type: "annual", payment_month: 9 }),
    ],
    variable_expense_categories: [
      base({ id: groceriesId, name: "Groceries", icon: "shopping-cart" }),
      base({ id: transportId, name: "Transport", icon: "car" }),
      base({ id: leisureId, name: "Leisure", icon: "coffee" }),
    ],
    variable_expenses: [
      base({ profile_id: profileId, category_id: groceriesId, name: "Weekly shop", amount: 320, date: dateOnly(new Date(now.getFullYear(), now.getMonth(), 4)) }),
      base({ profile_id: profileId, category_id: transportId, name: "Fuel", amount: 90, date: dateOnly(new Date(now.getFullYear(), now.getMonth(), 8)) }),
      base({ profile_id: profileId, category_id: leisureId, name: "Dining out", amount: 75, date: dateOnly(new Date(now.getFullYear(), now.getMonth(), 12)) }),
    ],
    category_budgets: [
      base({ profile_id: profileId, category_id: groceriesId, month_year: dateOnly(new Date(now.getFullYear(), now.getMonth(), 1)), limit_amount: 400 }),
      base({ profile_id: profileId, category_id: transportId, month_year: dateOnly(new Date(now.getFullYear(), now.getMonth(), 1)), limit_amount: 100 }),
      base({ profile_id: profileId, category_id: leisureId, month_year: dateOnly(new Date(now.getFullYear(), now.getMonth(), 1)), limit_amount: 80 }),
    ],
    variable_income: [],
    debts: [
      base({
        id: cardDebtId,
        profile_id: profileId,
        name: "Credit card",
        bank: "Demo Bank",
        balance: 2400,
        apr: 21.9,
        minimum_payment: 95,
        payment_day: 20,
        is_installment: false,
      }),
      base({
        profile_id: profileId,
        name: "Car loan",
        bank: "Demo Finance",
        balance: 6200,
        apr: 6.5,
        minimum_payment: 210,
        payment_day: 12,
        is_installment: true,
        total_amount: 9000,
        number_of_installments: 48,
        installment_amount: 210,
      }),
    ],
    debt_payments: [
      base({ profile_id: profileId, debt_id: cardDebtId, amount: 120, payment_date: dateOnly(new Date(now.getFullYear(), now.getMonth() - 1, 20)), notes: "Extra payment" }),
    ],
    savings: [
      base({
        profile_id: profileId,
        monthly_goal: 300,
        total_accumulated: 1250,
        goal_name: "General savings",
        goal_description: "Demo savings pot",
        emergency_fund: 800,
        monthly_emergency_contribution: 100,
      }),
    ],
    savings_goals: [
      base({
        profile_id: profileId,
        goal_name: "Holiday",
        goal_description: "Summer trip",
        target_amount: 2400,
        current_amount: 600,
        target_date: dateOnly(new Date(now.getFullYear() + 1, now.getMonth(), 1)),
        monthly_contribution: 150,
        is_active: true,
      }),
    ],
    savings_history: [],
    payment_tracker: [],
    notifications: [],
    achievements: [],
    audit_log: [],
    category_names: [],
    chat_conversations: [],
    chat_messages: [],
    household_members: [],
    household_invitations: [],
    household_user_roles: [],
    user_settings: [base({ currency: "GBP" })],
    app_settings: [base({ chart_type: "bar", color_theme: "default" })],
  };
};

let cache: GuestDB | null = null;

export const readDB = (): GuestDB => {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      cache = JSON.parse(raw) as GuestDB;
      return cache;
    }
  } catch {
    /* fall through to seed */
  }
  cache = buildSeed();
  writeDB(cache);
  return cache;
};

export const writeDB = (db: GuestDB) => {
  cache = db;
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(db));
  } catch {
    /* ignore quota errors */
  }
};

export const getTable = (table: string): GuestRow[] => {
  const db = readDB();
  if (!db[table]) db[table] = [];
  return db[table];
};

export const saveTable = (table: string, rows: GuestRow[]) => {
  const db = readDB();
  db[table] = rows;
  writeDB(db);
};

export const seedGuestData = () => {
  cache = buildSeed();
  writeDB(cache);
};

export const guestSession = () => ({
  access_token: "guest-demo-token",
  refresh_token: "guest-demo-refresh",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: guestUser(),
});

export const guestUser = () => ({
  id: GUEST_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: GUEST_EMAIL,
  created_at: iso(3),
  updated_at: iso(),
  app_metadata: { provider: "guest" },
  user_metadata: { name: "Guest", is_guest: true },
});
