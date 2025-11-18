import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserSettings {
  id: string;
  user_id: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export const useUserSettings = () => {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Si no existe configuración, crear una por defecto
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, currency: "USD" })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings as UserSettings;
      }
      
      return data as UserSettings;
    },
  });
};

export const useUpdateCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currency: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_settings")
        .update({ currency })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast.success("Moneda actualizada");
    },
    onError: () => {
      toast.error("Error al actualizar moneda");
    },
  });
};
