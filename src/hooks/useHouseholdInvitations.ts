import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HouseholdInvitation {
  id: string;
  household_id: string;
  invited_email: string;
  invited_by: string;
  role: string;
  status: string;
  invitation_code: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export const useHouseholdInvitations = (householdId?: string) => {
  return useQuery({
    queryKey: ["household-invitations", householdId],
    queryFn: async () => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from("household_invitations")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HouseholdInvitation[];
    },
    enabled: !!householdId,
  });
};

export const useMyInvitations = () => {
  return useQuery({
    queryKey: ["my-invitations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("household_invitations")
        .select("*")
        .eq("invited_email", user.email)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HouseholdInvitation[];
    },
  });
};

export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      householdId, 
      email, 
      role 
    }: { 
      householdId: string; 
      email: string; 
      role: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Generar código único de 8 caracteres
      const invitationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { data, error } = await supabase
        .from("household_invitations")
        .insert({
          household_id: householdId,
          invited_email: email,
          invited_by: user.id,
          role,
          invitation_code: invitationCode,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-invitations"] });
      toast.success("Invitación enviada");
    },
    onError: (error: any) => {
      if (error.message.includes("duplicate")) {
        toast.error("Ya existe una invitación para este email");
      } else {
        toast.error("Error al enviar invitación");
      }
    },
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invitationId, 
      displayName 
    }: { 
      invitationId: string; 
      displayName: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Obtener la invitación
      const { data: invitation, error: invError } = await supabase
        .from("household_invitations")
        .select("*")
        .eq("id", invitationId)
        .single();

      if (invError) throw invError;

      // Verificar que la invitación es para este usuario
      if (invitation.invited_email !== user.email) {
        throw new Error("Esta invitación no es para ti");
      }

      // Verificar que no esté expirada
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error("Esta invitación ha expirado");
      }

      // Crear membresía
      const { error: memberError } = await supabase
        .from("household_members")
        .insert({
          household_id: invitation.household_id,
          user_id: user.id,
          display_name: displayName,
          status: "approved",
        });

      if (memberError) throw memberError;

      // Crear rol
      const { error: roleError } = await supabase
        .from("household_user_roles")
        .insert({
          household_id: invitation.household_id,
          user_id: user.id,
          role: invitation.role as "owner" | "member" | "viewer" | "contributor" | "editor",
        });

      if (roleError) throw roleError;

      // Actualizar invitación
      const { error: updateError } = await supabase
        .from("household_invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-household"] });
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      toast.success("Te has unido al hogar");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al aceptar invitación");
    },
  });
};

export const useRejectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("household_invitations")
        .update({ status: "rejected" })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      toast.success("Invitación rechazada");
    },
    onError: () => {
      toast.error("Error al rechazar invitación");
    },
  });
};

export const useCancelInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("household_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-invitations"] });
      toast.success("Invitación cancelada");
    },
    onError: () => {
      toast.error("Error al cancelar invitación");
    },
  });
};
