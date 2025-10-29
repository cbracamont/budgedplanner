import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const useHouseholdMembers = (householdId?: string) => {
  return useQuery({
    queryKey: ["household-members", householdId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let query = supabase
        .from("household_members")
        .select("*")
        .order("joined_at", { ascending: true });

      if (householdId) {
        query = query.eq("household_id", householdId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HouseholdMember[];
    },
    enabled: !!householdId,
  });
};

export const useMyHousehold = () => {
  return useQuery({
    queryKey: ["my-household"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("household_members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as HouseholdMember | null;
    },
  });
};

export const useCreateHousehold = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ displayName }: { displayName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if user is already in a household
      const { data: existingMembership } = await supabase
        .from("household_members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMembership) {
        throw new Error("Ya perteneces a un hogar. Debes salir primero antes de crear uno nuevo.");
      }

      const householdId = crypto.randomUUID();

      const { data, error } = await supabase
        .from("household_members")
        .insert([{
          household_id: householdId,
          user_id: user.id,
          role: "owner",
          display_name: displayName,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-household"] });
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      toast.success("Hogar creado exitosamente");
    },
    onError: (error: Error) => {
      if (error.message.includes("Ya perteneces")) {
        toast.error(error.message);
      } else {
        toast.error("Error al crear el hogar");
      }
    },
  });
};

export const useJoinHousehold = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId, displayName }: { householdId: string; displayName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if user is already in a household
      const { data: existingMembership } = await supabase
        .from("household_members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMembership) {
        throw new Error("Ya perteneces a un hogar. Debes salir primero antes de unirte a otro.");
      }

      const { data, error } = await supabase
        .from("household_members")
        .insert([{
          household_id: householdId,
          user_id: user.id,
          role: "member",
          display_name: displayName,
          status: "pending",
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-household"] });
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      toast.success("Solicitud de unión enviada. Esperando aprobación del propietario.");
    },
    onError: (error: Error) => {
      if (error.message.includes("Ya perteneces")) {
        toast.error(error.message);
      } else {
        toast.error("Error al unirse al hogar");
      }
    },
  });
};

export const useLeaveHousehold = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-household"] });
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      toast.success("Has salido del hogar");
    },
    onError: () => {
      toast.error("Error al salir del hogar");
    },
  });
};

export const useApproveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("household_members")
        .update({ status: "approved" })
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      toast.success("Miembro aprobado exitosamente");
    },
    onError: () => {
      toast.error("Error al aprobar miembro");
    },
  });
};

export const useRejectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      toast.success("Solicitud rechazada");
    },
    onError: () => {
      toast.error("Error al rechazar solicitud");
    },
  });
};