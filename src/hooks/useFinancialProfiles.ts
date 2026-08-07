import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FinancialProfile {
  id: string;
  user_id: string;
  name: string;
  type: string;
  is_active: boolean;
  household_id?: string | null;
  created_at: string;
  updated_at: string;
}

const ACTIVE_PROFILE_STORAGE_KEY = "active-financial-profile-id";

const readStoredProfileId = () => {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeProfileId = (id: string) => {
  try {
    localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, id);
  } catch {
    /* ignore storage failures */
  }
};

/**
 * Returns the user's own profiles plus the shared profile of the household
 * (family group) they belong to, so family data can be edited by every member.
 */
const fetchAccessibleProfiles = async (): Promise<FinancialProfile[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const [own, membership] = await Promise.all([
    supabase
      .from("financial_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("household_members")
      .select("household_id, status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (own.error) throw own.error;

  let shared: FinancialProfile[] = [];
  const householdId = membership.data?.status === "approved" ? membership.data.household_id : null;

  if (householdId) {
    const { data, error } = await supabase
      .from("financial_profiles")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    shared = (data ?? []) as FinancialProfile[];
  }

  const merged = new Map<string, FinancialProfile>();
  for (const profile of [...(own.data ?? []), ...shared] as FinancialProfile[]) {
    merged.set(profile.id, profile);
  }
  return Array.from(merged.values());
};

export const isSharedProfile = (profile?: FinancialProfile | null) => !!profile?.household_id;

export const useFinancialProfiles = () => {
  return useQuery({
    queryKey: ["financial-profiles"],
    queryFn: fetchAccessibleProfiles,
  });
};

export const useActiveProfile = () => {
  return useQuery({
    queryKey: ["active-profile"],
    queryFn: async () => {
      const profiles = await fetchAccessibleProfiles();
      if (profiles.length === 0) return null;

      const storedId = readStoredProfileId();
      const stored = profiles.find((p) => p.id === storedId);
      if (stored) return stored;

      // Fall back to the flagged profile, then to the first accessible one.
      const flagged = profiles
        .filter((p) => p.is_active && !p.household_id)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];

      return flagged ?? profiles[0];
    },
  });
};

export const useAddProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: { name: string; type: string; is_active?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("financial_profiles")
        .insert([{ ...profile, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["active-profile"] });
      toast.success("Perfil creado exitosamente");
    },
    onError: (error) => {
      toast.error("Error al crear el perfil");
      console.error(error);
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from("financial_profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["active-profile"] });
      toast.success("Perfil actualizado");
    },
    onError: (error) => {
      toast.error("Error al actualizar el perfil");
      console.error(error);
    },
  });
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["active-profile"] });
      toast.success("Perfil eliminado");
    },
    onError: (error) => {
      toast.error("Error al eliminar el perfil");
      console.error(error);
    },
  });
};

export const useSetActiveProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // The selection is per-device/per-user so a shared family profile can be
      // opened by one member without switching the context of the others.
      storeProfileId(profileId);

      const { data: profile } = await supabase
        .from("financial_profiles")
        .select("id, user_id, household_id")
        .eq("id", profileId)
        .maybeSingle();

      if (profile && profile.user_id === user.id && !profile.household_id) {
        const { error } = await supabase
          .rpc("set_active_financial_profile", { p_profile_id: profileId })
          .single();
        if (error) throw error;
      }

      return profileId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["active-profile"] });
      queryClient.invalidateQueries({ queryKey: ["income_sources"] });
      queryClient.invalidateQueries({ queryKey: ["variable-income"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["fixed_expenses"] });
      queryClient.invalidateQueries({ queryKey: ["variable_expenses"] });
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      queryClient.invalidateQueries({ queryKey: ["payment-tracker"] });
      toast.success("Perfil activo cambiado");
    },
    onError: (error) => {
      toast.error("Error al cambiar el perfil");
      console.error(error);
    },
  });
};
