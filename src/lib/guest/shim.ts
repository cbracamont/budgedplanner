/**
 * Guest mode shim.
 *
 * When guest mode is on we patch the shared Supabase client so every existing
 * hook keeps working unchanged, but reads/writes hit the local demo database
 * instead of the backend. Installed once at boot, before React renders.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  GuestRow,
  getTable,
  guestSession,
  guestUser,
  isGuestMode,
  readDB,
  saveTable,
  setGuestMode,
  uuid,
  GUEST_USER_ID,
} from "./store";

type Filter = { op: string; column: string; value: any };

const now = () => new Date().toISOString();

const compare = (row: GuestRow, f: Filter) => {
  const v = row[f.column];
  switch (f.op) {
    case "eq":
      return String(v) === String(f.value);
    case "neq":
      return String(v) !== String(f.value);
    case "gt":
      return v > f.value;
    case "gte":
      return v >= f.value;
    case "lt":
      return v < f.value;
    case "lte":
      return v <= f.value;
    case "in":
      return (f.value as any[]).some((x) => String(x) === String(v));
    case "is":
      return f.value === null ? v === null || v === undefined : v === f.value;
    case "like":
    case "ilike":
      return String(v ?? "")
        .toLowerCase()
        .includes(String(f.value).replace(/%/g, "").toLowerCase());
    default:
      return true;
  }
};

class GuestQuery<T = any> implements PromiseLike<any> {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: GuestRow[] = [];
  private returning = false;
  private singleMode: "one" | "maybe" | null = null;
  private headOnly = false;
  private wantCount = false;

  constructor(private table: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.mode === "select") this.mode = "select";
    this.returning = true;
    if (opts?.head) this.headOnly = true;
    if (opts?.count) this.wantCount = true;
    return this;
  }

  insert(rows: GuestRow | GuestRow[]) {
    this.mode = "insert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  upsert(rows: GuestRow | GuestRow[], _opts?: any) {
    this.mode = "upsert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(values: GuestRow) {
    this.mode = "update";
    this.payload = [values];
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ op: "eq", column, value });
    return this;
  }
  neq(column: string, value: any) {
    this.filters.push({ op: "neq", column, value });
    return this;
  }
  gt(column: string, value: any) {
    this.filters.push({ op: "gt", column, value });
    return this;
  }
  gte(column: string, value: any) {
    this.filters.push({ op: "gte", column, value });
    return this;
  }
  lt(column: string, value: any) {
    this.filters.push({ op: "lt", column, value });
    return this;
  }
  lte(column: string, value: any) {
    this.filters.push({ op: "lte", column, value });
    return this;
  }
  in(column: string, value: any[]) {
    this.filters.push({ op: "in", column, value });
    return this;
  }
  is(column: string, value: any) {
    this.filters.push({ op: "is", column, value });
    return this;
  }
  like(column: string, value: string) {
    this.filters.push({ op: "like", column, value });
    return this;
  }
  ilike(column: string, value: string) {
    this.filters.push({ op: "ilike", column, value });
    return this;
  }
  not(column: string, op: string, value: any) {
    this.filters.push({ op: op === "is" ? "neq" : "neq", column, value });
    return this;
  }
  or() {
    // Local demo store ignores OR filters (data is already user-scoped).
    return this;
  }
  order(column: string, opts?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: opts?.ascending !== false };
    return this;
  }
  limit(count: number) {
    this.limitCount = count;
    return this;
  }
  range(from: number, to: number) {
    this.limitCount = to - from + 1;
    return this;
  }
  maybeSingle() {
    this.singleMode = "maybe";
    return this;
  }
  single() {
    this.singleMode = "one";
    return this;
  }

  private matches(rows: GuestRow[]) {
    return rows.filter((row) => this.filters.every((f) => compare(row, f)));
  }

  private run() {
    const rows = getTable(this.table);
    let result: GuestRow[] = [];

    if (this.mode === "insert" || this.mode === "upsert") {
      const inserted = this.payload.map((r) => ({
        id: r.id ?? uuid(),
        created_at: now(),
        updated_at: now(),
        ...r,
        user_id: r.user_id ?? GUEST_USER_ID,
      }));
      let next = rows;
      if (this.mode === "upsert") {
        next = rows.filter((row) => !inserted.some((i) => i.id === row.id));
      }
      saveTable(this.table, [...next, ...inserted]);
      result = inserted;
    } else if (this.mode === "update") {
      const patch = { ...this.payload[0], updated_at: now() };
      const updated: GuestRow[] = [];
      const next = rows.map((row) => {
        if (this.filters.every((f) => compare(row, f))) {
          const merged = { ...row, ...patch };
          updated.push(merged);
          return merged;
        }
        return row;
      });
      saveTable(this.table, next);
      result = updated;
    } else if (this.mode === "delete") {
      const removed = this.matches(rows);
      saveTable(
        this.table,
        rows.filter((row) => !removed.includes(row))
      );
      result = removed;
    } else {
      result = this.matches(rows);
      if (this.orderBy) {
        const { column, ascending } = this.orderBy;
        result = [...result].sort((a, b) => {
          const av = a[column];
          const bv = b[column];
          if (av === bv) return 0;
          const cmp = av > bv ? 1 : -1;
          return ascending ? cmp : -cmp;
        });
      }
      if (this.limitCount !== null) result = result.slice(0, this.limitCount);
    }

    const count = result.length;
    if (this.headOnly) return { data: null, error: null, count };
    if (this.singleMode === "one") {
      if (result.length !== 1) {
        return {
          data: null,
          error: result.length === 0 ? { message: "No rows found", code: "PGRST116" } : { message: "Multiple rows found" },
          count,
        };
      }
      return { data: result[0], error: null, count };
    }
    if (this.singleMode === "maybe") return { data: result[0] ?? null, error: null, count };
    return { data: this.wantCount && !this.returning ? null : result, error: null, count };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    let value: any;
    try {
      value = this.run();
    } catch (e: any) {
      value = { data: null, error: { message: e?.message ?? "Guest store error" }, count: null };
    }
    return Promise.resolve(value).then(onfulfilled as any, onrejected as any);
  }
}

const guestRpc = async (fn: string, args: any = {}) => {
  const db = readDB();
  switch (fn) {
    case "set_active_financial_profile": {
      const profiles: any[] = (db.financial_profiles ?? []) as any[];
      const next: any[] = profiles.map((p: any) => ({ ...p, is_active: p.id === args.p_profile_id }));
      saveTable("financial_profiles", next);
      return { data: next.find((p: any) => p.id === args.p_profile_id) ?? null, error: null };
    }
    case "ensure_household_shared_profile":
    case "log_audit_entry":
      return { data: null, error: null };
    default:
      return { data: null, error: { message: "This action needs an account. Sign up to use it." } };
  }
};

let installed = false;

/** Patch the Supabase client for the local demo experience. */
export const installGuestShim = () => {
  if (installed || !isGuestMode()) return;
  installed = true;

  const client = supabase as any;

  client.from = (table: string) => new GuestQuery(table) as any;
  client.rpc = (fn: string, args?: any) => guestRpc(fn, args) as any;

  client.functions = {
    invoke: async () => ({
      data: null,
      error: { message: "AI and email features are disabled in demo mode. Create an account to unlock them." },
    }),
  };

  client.channel = () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} }),
  });
  client.removeChannel = () => {};

  client.auth = {
    ...client.auth,
    getUser: async () => ({ data: { user: guestUser() }, error: null }),
    getSession: async () => ({ data: { session: guestSession() }, error: null }),
    onAuthStateChange: (cb: any) => {
      setTimeout(() => cb("SIGNED_IN", guestSession()), 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: async () => {
      setGuestMode(false);
      return { error: null };
    },
    updateUser: async () => ({ data: { user: guestUser() }, error: null }),
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: { message: "Leave demo mode first to sign in." },
    }),
  };
};
