import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FinancialProfile {
  id: string;
  user_id: string;
  name: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useFinancialProfiles = () => {
  return useQuery({
    queryKey: ["financial-profiles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("financial_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as FinancialProfile[];
    },
  });
};

export const useActiveProfile = () => {
  return useQuery({
    queryKey: ["active-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("financial_profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as FinancialProfile | null;
    },
  });
};

export const useAddProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Omit<FinancialProfile, "id" | "user_id" | "created_at" | "updated_at">) => {
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

      // Deactivate all profiles first
      await supabase
        .from("financial_profiles")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // Activate the selected profile
      const { data, error } = await supabase
        .from("financial_profiles")
        .update({ is_active: true })
        .eq("id", profileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["active-profile"] });
      queryClient.invalidateQueries({ queryKey: ["income-sources"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["variable-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      toast.success("Perfil activo cambiado");
    },
    onError: (error) => {
      toast.error("Error al cambiar el perfil");
      console.error(error);
    },
  });
};