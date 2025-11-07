import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HouseholdUserRole } from "./useHousehold";

export const useHouseholdRole = (householdId?: string) => {
  return useQuery({
    queryKey: ["household-role", householdId],
    queryFn: async () => {
      if (!householdId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("household_user_roles")
        .select("*")
        .eq("household_id", householdId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as HouseholdUserRole;
    },
    enabled: !!householdId,
  });
};

export const useIsHouseholdOwner = (householdId?: string) => {
  const { data: role } = useHouseholdRole(householdId);
  return role?.role === 'owner';
};
