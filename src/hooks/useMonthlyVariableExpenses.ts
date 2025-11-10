import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFinancialProfiles } from "./useFinancialProfiles";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface MonthlyVariableExpense {
  id: string;
  user_id: string;
  profile_id: string | null;
  amount: number;
  date: string;
  name: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewMonthlyVariableExpense {
  amount: number;
  date: string;
  name?: string;
  category_id?: string;
}

// Fetch variable expenses for a specific month
export const useMonthlyVariableExpenses = (monthYear?: Date) => {
  const { data: profiles = [] } = useFinancialProfiles();
  const activeProfile = profiles.find(p => p.is_active);

  return useQuery({
    queryKey: ['monthly_variable_expenses', monthYear?.toISOString(), activeProfile?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentMonth = monthYear || new Date();
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      let query = supabase
        .from('variable_expenses')
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
      return data as MonthlyVariableExpense[];
    },
    enabled: !!monthYear,
  });
};

// Calculate total variable expenses for a specific month
export const useMonthlyVariableExpensesTotal = (monthYear?: Date) => {
  const { data: expenses = [] } = useMonthlyVariableExpenses(monthYear);
  
  return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
};

// Add new variable expense entry
export const useAddMonthlyVariableExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profiles = [] } = useFinancialProfiles();
  const activeProfile = profiles.find(p => p.is_active);

  return useMutation({
    mutationFn: async (newExpense: NewMonthlyVariableExpense) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('variable_expenses')
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id || null,
          amount: newExpense.amount,
          date: newExpense.date,
          name: newExpense.name || null,
          category_id: newExpense.category_id || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_variable_expenses'] });
      toast({
        title: 'Éxito',
        description: 'Gasto variable agregado correctamente',
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

// Update variable expense entry
export const useUpdateMonthlyVariableExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; amount?: number; date?: string; name?: string; category_id?: string }) => {
      const { error } = await supabase
        .from('variable_expenses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_variable_expenses'] });
      toast({
        title: 'Éxito',
        description: 'Gasto variable actualizado correctamente',
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

// Delete variable expense entry
export const useDeleteMonthlyVariableExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('variable_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_variable_expenses'] });
      toast({
        title: 'Éxito',
        description: 'Gasto variable eliminado correctamente',
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
