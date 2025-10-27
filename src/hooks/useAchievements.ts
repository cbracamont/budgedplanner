import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Achievement {
  id: string;
  user_id: string;
  profile_id: string | null;
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
  metadata: any;
  created_at: string;
}

export const useAchievements = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    },
  });
};

export const useAddAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievement: Omit<Achievement, "id" | "user_id" | "created_at" | "earned_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("achievements")
        .insert([{ ...achievement, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
};