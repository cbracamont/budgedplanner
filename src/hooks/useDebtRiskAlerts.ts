import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DebtRiskAlert {
  id: string;
  user_id: string;
  profile_id: string | null;
  alert_type: string;
  risk_level: string;
  debt_to_income_ratio: number;
  message: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export const useDebtRiskAlerts = () => {
  return useQuery({
    queryKey: ["debt-risk-alerts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("debt_risk_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DebtRiskAlert[];
    },
  });
};

export const useUnacknowledgedAlerts = () => {
  return useQuery({
    queryKey: ["unacknowledged-alerts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("debt_risk_alerts")
        .select("*")
        .eq("user_id", user.id)
        .eq("acknowledged", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DebtRiskAlert[];
    },
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("debt_risk_alerts")
        .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debt-risk-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unacknowledged-alerts"] });
    },
  });
};

export const useCreateDebtRiskAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: Omit<DebtRiskAlert, "id" | "user_id" | "created_at" | "acknowledged" | "acknowledged_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("debt_risk_alerts")
        .insert([{ ...alert, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debt-risk-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unacknowledged-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });
};