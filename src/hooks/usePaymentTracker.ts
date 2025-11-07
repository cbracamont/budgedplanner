import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth, format, endOfMonth } from "date-fns";

export interface PaymentTrackerEntry {
  id: string;
  user_id: string;
  profile_id?: string;
  month_year: string;
  payment_type: "income" | "expense" | "debt" | "savings";
  source_id?: string;
  source_table?: string;
  amount: number;
  payment_status: "pending" | "paid" | "partial";
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_manual?: boolean; // Added to distinguish manual from auto-generated payments
}

export interface NewPaymentTrackerEntry {
  month_year: string;
  payment_type: "income" | "expense" | "debt" | "savings";
  source_id?: string;
  source_table?: string;
  amount: number;
  payment_status?: "pending" | "paid" | "partial";
  payment_date?: string;
  notes?: string;
}

export const usePaymentTracker = (monthYear?: Date, profileId?: string | null) => {
  const targetMonth = monthYear ? format(startOfMonth(monthYear), "yyyy-MM-dd") : format(startOfMonth(new Date()), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["payment-tracker", targetMonth, profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("payment_tracker")
        .select("*")
        .eq("user_id", user.id)
        .eq("month_year", targetMonth)
        .order("payment_date", { ascending: true });

      // Filter by profile if provided
      if (profileId !== undefined) {
        if (profileId === null) {
          query = query.is("profile_id", null);
        } else {
          query = query.eq("profile_id", profileId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PaymentTrackerEntry[];
    },
  });
};

// Hook to get ALL payment history (for projections)
export const useAllPaymentHistory = (profileId?: string | null) => {
  return useQuery({
    queryKey: ["payment-tracker-all", profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("payment_tracker")
        .select("*")
        .eq("user_id", user.id)
        .eq("payment_type", "debt")
        .order("month_year", { ascending: true });

      // Filter by profile if provided
      if (profileId !== undefined) {
        if (profileId === null) {
          query = query.is("profile_id", null);
        } else {
          query = query.eq("profile_id", profileId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PaymentTrackerEntry[];
    },
  });
};

// Hook to get COMBINED payments from both payment_tracker AND debt_payments for a specific month
export const useCombinedMonthlyPayments = (monthYear?: Date, profileId?: string | null) => {
  const targetMonth = monthYear ? format(startOfMonth(monthYear), "yyyy-MM-dd") : format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthStart = startOfMonth(monthYear || new Date());
  const monthEnd = endOfMonth(monthYear || new Date());

  return useQuery({
    queryKey: ["combined-monthly-payments", targetMonth, profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get payments from payment_tracker
      let trackerQuery = supabase
        .from("payment_tracker")
        .select("*")
        .eq("user_id", user.id)
        .eq("month_year", targetMonth)
        .eq("payment_type", "debt");

      if (profileId !== undefined) {
        if (profileId === null) {
          trackerQuery = trackerQuery.is("profile_id", null);
        } else {
          trackerQuery = trackerQuery.eq("profile_id", profileId);
        }
      }

      const { data: trackerData, error: trackerError } = await trackerQuery;
      if (trackerError) throw trackerError;

      // Get manual payments from debt_payments for this month
      let debtPaymentsQuery = supabase
        .from("debt_payments")
        .select("*")
        .eq("user_id", user.id)
        .gte("payment_date", format(monthStart, "yyyy-MM-dd"))
        .lte("payment_date", format(monthEnd, "yyyy-MM-dd"));

      if (profileId !== undefined) {
        if (profileId === null) {
          debtPaymentsQuery = debtPaymentsQuery.is("profile_id", null);
        } else {
          debtPaymentsQuery = debtPaymentsQuery.eq("profile_id", profileId);
        }
      }

      const { data: debtPaymentsData, error: debtPaymentsError } = await debtPaymentsQuery;
      if (debtPaymentsError) throw debtPaymentsError;

      // Transform debt_payments to match PaymentTrackerEntry format
      const transformedDebtPayments: PaymentTrackerEntry[] = (debtPaymentsData || []).map(payment => ({
        id: payment.id,
        user_id: payment.user_id,
        profile_id: payment.profile_id || undefined,
        month_year: targetMonth,
        payment_type: "debt" as const,
        source_id: payment.debt_id,
        source_table: "debts",
        amount: payment.amount,
        payment_status: "paid" as const,
        payment_date: payment.payment_date,
        notes: payment.notes || "Pago manual desde gestor de deudas",
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        is_manual: true, // Mark as manual payment
      }));

      // Combine both sources, marking tracker payments
      const trackerPayments: PaymentTrackerEntry[] = (trackerData || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        profile_id: p.profile_id,
        month_year: p.month_year,
        payment_type: p.payment_type as "income" | "expense" | "debt" | "savings",
        source_id: p.source_id,
        source_table: p.source_table,
        amount: p.amount,
        payment_status: p.payment_status as "pending" | "paid" | "partial",
        payment_date: p.payment_date,
        notes: p.notes,
        created_at: p.created_at,
        updated_at: p.updated_at,
        is_manual: false, // Mark as auto-generated
      }));

      // Merge and sort by payment_date
      const combined = [...trackerPayments, ...transformedDebtPayments].sort((a, b) => {
        const dateA = a.payment_date ? new Date(a.payment_date).getTime() : 0;
        const dateB = b.payment_date ? new Date(b.payment_date).getTime() : 0;
        return dateA - dateB;
      });

      return combined;
    },
  });
};

// Hook to get only paid/completed payments for overview calculations
export const usePaidPaymentsForOverview = (profileId?: string | null) => {
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ["payment-tracker-overview", today, profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("payment_tracker")
        .select("*")
        .eq("user_id", user.id)
        .lte("payment_date", today)
        .eq("payment_status", "paid");

      // Filter by profile if provided
      if (profileId !== undefined) {
        if (profileId === null) {
          query = query.is("profile_id", null);
        } else {
          query = query.eq("profile_id", profileId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PaymentTrackerEntry[];
    },
  });
};

export const useAddPaymentTracker = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: NewPaymentTrackerEntry & { profile_id?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("payment_tracker").insert({
        user_id: user.id,
        ...entry,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-tracker"] });
      queryClient.invalidateQueries({ queryKey: ["payment-tracker-overview"] });
      toast({
        title: "Success",
        description: "Payment tracked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePaymentTracker = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentTrackerEntry> & { id: string }) => {
      const { error } = await supabase
        .from("payment_tracker")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-tracker"] });
      queryClient.invalidateQueries({ queryKey: ["payment-tracker-overview"] });
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeletePaymentTracker = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_tracker")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-tracker"] });
      queryClient.invalidateQueries({ queryKey: ["payment-tracker-overview"] });
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
