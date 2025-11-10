import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFinancialProfiles } from "./useFinancialProfiles";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface MonthlyVariableIncome {
  id: string;
  user_id: string;
  profile_id: string | null;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewMonthlyVariableIncome {
  amount: number;
  date: string;
  description?: string;
}

// Fetch variable income for a specific month
export const useMonthlyVariableIncome = (monthYear?: Date) => {
  const { data: profiles = [] } = useFinancialProfiles();
  const activeProfile = profiles.find(p => p.is_active);

  return useQuery({
    queryKey: ['monthly_variable_income', monthYear?.toISOString(), activeProfile?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentMonth = monthYear || new Date();
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      let query = supabase
        .from('variable_income')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (activeProfile?.id) {
        query = query.eq('profile_id', activeProfile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MonthlyVariableIncome[];
    },
    enabled: !!monthYear,
  });
};

// Calculate total variable income for a specific month
export const useMonthlyVariableIncomeTotal = (monthYear?: Date) => {
  const { data: incomes = [] } = useMonthlyVariableIncome(monthYear);
  
  return incomes.reduce((sum, income) => sum + Number(income.amount), 0);
};

// Add new variable income entry
export const useAddMonthlyVariableIncome = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profiles = [] } = useFinancialProfiles();
  const activeProfile = profiles.find(p => p.is_active);

  return useMutation({
    mutationFn: async (newIncome: NewMonthlyVariableIncome) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('variable_income')
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id || null,
          amount: newIncome.amount,
          date: newIncome.date,
          description: newIncome.description || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_variable_income'] });
      toast({
        title: 'Éxito',
        description: 'Ingreso variable agregado correctamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Update variable income entry
export const useUpdateMonthlyVariableIncome = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; amount?: number; date?: string; description?: string }) => {
      const { error } = await supabase
        .from('variable_income')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_variable_income'] });
      toast({
        title: 'Éxito',
        description: 'Ingreso variable actualizado correctamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Delete variable income entry
export const useDeleteMonthlyVariableIncome = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('variable_income')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_variable_income'] });
      toast({
        title: 'Éxito',
        description: 'Ingreso variable eliminado correctamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
