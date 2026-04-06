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
      role,
      language = "en",
    }: { 
      householdId: string; 
      email: string; 
      role: string;
      language?: string;
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

      // Send invitation email
      try {
        await supabase.functions.invoke("send-invitation-email", {
          body: {
            recipientEmail: email,
            invitationCode,
            role,
            senderEmail: user.email,
            language,
          },
        });
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the whole mutation - invitation was created successfully
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-invitations"] });
      toast.success("Invitation sent successfully");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("An invitation already exists for this email");
      } else {
        toast.error("Error sending invitation");
      }
    },
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.rpc("accept_household_invitation", {
        _invitation_id: invitationId,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-household"] });
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      toast.success("You have joined the household");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error accepting invitation");
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
      toast.success("Invitation rejected");
    },
    onError: () => {
      toast.error("Error rejecting invitation");
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
      toast.success("Invitation cancelled");
    },
    onError: () => {
      toast.error("Error cancelling invitation");
    },
  });
};

export const useJoinByCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationCode: string) => {
      const { error } = await supabase.rpc("join_household_by_code", {
        _invitation_code: invitationCode,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-household"] });
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      toast.success("Successfully joined the household");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error joining household");
    },
  });
};

