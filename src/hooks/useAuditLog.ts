import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AuditLogEntry {
  id: string;
  household_id: string | null;
  user_id: string;
  profile_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
  user_display_name: string | null;
}

export const useAuditLog = (householdId?: string) => {
  return useQuery({
    queryKey: ["audit-log", householdId],
    queryFn: async () => {
      let query = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (householdId) {
        query = query.eq("household_id", householdId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        query = query.eq("user_id", user.id).is("household_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });
};

export const useLogAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      householdId,
      profileId,
      action,
      tableName,
      recordId,
      oldValues,
      newValues,
      displayName,
    }: {
      householdId?: string;
      profileId?: string;
      action: string;
      tableName: string;
      recordId?: string;
      oldValues?: any;
      newValues?: any;
      displayName?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("audit_log")
        .insert({
          household_id: householdId || null,
          user_id: user.id,
          profile_id: profileId || null,
          action,
          table_name: tableName,
          record_id: recordId || null,
          old_values: oldValues || null,
          new_values: newValues || null,
          user_display_name: displayName || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });
};
