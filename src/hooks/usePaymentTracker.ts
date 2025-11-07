import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth, format } from "date-fns";

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

export const usePaymentTracker = (monthYear?: Date) => {
  const targetMonth = monthYear ? format(startOfMonth(monthYear), "yyyy-MM-dd") : format(startOfMonth(new Date()), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["payment-tracker", targetMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("payment_tracker")
        .select("*")
        .eq("user_id", user.id)
        .eq("month_year", targetMonth)
        .order("payment_date", { ascending: true });

      if (error) throw error;
      return data as PaymentTrackerEntry[];
    },
  });
};

export const useAddPaymentTracker = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: NewPaymentTrackerEntry) => {
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
