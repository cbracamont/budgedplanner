import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useApproveHouseholdMember = () => {
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

export const useRejectHouseholdMember = () => {
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
      toast.error("Error al rechazar miembro");
    },
  });
};
