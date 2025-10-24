import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DebtPayment {
  id: string;
  user_id: string;
  debt_id: string;
  profile_id: string | null;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface NewDebtPayment {
  debt_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  profile_id?: string;
}

// Fetch all debt payments for a specific debt
export const useDebtPayments = (debtId?: string) => {
  return useQuery({
    queryKey: ["debt_payments", debtId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("debt_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("payment_date", { ascending: false });

      if (debtId) {
        query = query.eq("debt_id", debtId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DebtPayment[];
    },
    enabled: true,
  });
};

// Add a new debt payment
export const useAddDebtPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: NewDebtPayment) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("debt_payments")
        .insert([
          {
            user_id: user.id,
            debt_id: payment.debt_id,
            amount: payment.amount,
            payment_date: payment.payment_date,
            notes: payment.notes || null,
            profile_id: payment.profile_id || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debt_payments"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Payment recorded successfully");
    },
    onError: (error) => {
      toast.error("Failed to record payment: " + error.message);
    },
  });
};

// Update a debt payment
export const useUpdateDebtPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payment }: { id: string; payment: Partial<NewDebtPayment> }) => {
      const { data, error } = await supabase
        .from("debt_payments")
        .update({
          amount: payment.amount,
          payment_date: payment.payment_date,
          notes: payment.notes || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debt_payments"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Payment updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update payment: " + error.message);
    },
  });
};

// Delete a debt payment
export const useDeleteDebtPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from("debt_payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debt_payments"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Payment deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete payment: " + error.message);
    },
  });
};

// Get payment history grouped by month
export const useDebtPaymentHistory = () => {
  return useQuery({
    queryKey: ["debt_payment_history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("debt_payments")
        .select(`
          *,
          debts (
            name,
            bank
          )
        `)
        .eq("user_id", user.id)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
