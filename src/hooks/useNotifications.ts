import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActiveProfile } from "./useFinancialProfiles";

export interface Notification {
  id: string;
  user_id: string;
  profile_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_id: string | null;
  related_table: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// Notifications belong to a financial profile. Legacy rows have no profile_id,
// so those are always included to avoid hiding older reminders.
const profileFilter = (profileId?: string) =>
  profileId ? `profile_id.eq.${profileId},profile_id.is.null` : "profile_id.is.null";

export const useNotifications = () => {
  const { data: activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id;

  return useQuery({
    queryKey: ["notifications", profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .or(profileFilter(profileId))
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useUnreadNotifications = () => {
  const { data: activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id;

  return useQuery({
    queryKey: ["unread-notifications", profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .or(profileFilter(profileId))
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { data: activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id;

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Only mark the notifications of the profile currently being viewed,
      // so reminders of other profiles are not silently dismissed.
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)
        .or(profileFilter(profileId));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
      toast.success("Todas las notificaciones marcadas como leídas");
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });
};
