import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Income hooks
export const useIncomeSources = () => {
  return useQuery({
    queryKey: ['income_sources'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) return [];

      const { data, error } = await supabase
        .from('income_sources')
        .select('*')
        .eq('profile_id', activeProfile.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useAddIncome = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (income: { name: string; amount: number; payment_day: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) throw new Error('No active profile');
      
      const { error } = await supabase.from('income_sources').insert({
        user_id: user.id,
        profile_id: activeProfile.id,
        ...income
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_sources'] });
      toast({ title: 'Success', description: 'Income source added' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

export const useUpdateIncome = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name: string; amount: number; payment_day: number }) => {
      const { error } = await supabase
        .from('income_sources')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_sources'] });
      toast({ title: 'Success', description: 'Income source updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('income_sources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_sources'] });
      toast({ title: 'Success', description: 'Income source deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

// Debts hooks
export const useDebts = () => {
  return useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) return [];

      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('profile_id', activeProfile.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useAddDebt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (debt: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) throw new Error('No active profile');
      
      const { error } = await supabase.from('debts').insert({
        user_id: user.id,
        profile_id: activeProfile.id,
        ...debt
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast({ title: 'Success', description: 'Debt added' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

export const useUpdateDebt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast({ title: 'Success', description: 'Debt updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

export const useDeleteDebt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast({ title: 'Success', description: 'Debt deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

// Fixed Expenses hooks
export const useFixedExpenses = () => {
  return useQuery({
    queryKey: ['fixed_expenses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) return [];

      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('profile_id', activeProfile.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useAddFixedExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (expense: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) throw new Error('No active profile');
      
      const { error } = await supabase.from('fixed_expenses').insert({
        user_id: user.id,
        profile_id: activeProfile.id,
        ...expense
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      toast({ title: 'Success', description: 'Expense added' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

export const useUpdateFixedExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('fixed_expenses')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      toast({ title: 'Success', description: 'Expense updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

export const useDeleteFixedExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      toast({ title: 'Success', description: 'Expense deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

// Variable Expenses hooks
export const useVariableExpenses = () => {
  return useQuery({
    queryKey: ['variable_expenses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) return [];
      
      const { data, error } = await supabase
        .from('variable_expenses')
        .select('*')
        .eq('profile_id', activeProfile.id);
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useAddVariableExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (expense: { name: string; amount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) throw new Error('No active profile');
      
      const { error } = await supabase.from('variable_expenses').insert({
        user_id: user.id,
        profile_id: activeProfile.id,
        ...expense
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable_expenses'] });
      toast({ title: 'Success', description: 'Expense added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

export const useUpdateVariableExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name: string; amount: number }) => {
      const { error } = await supabase
        .from('variable_expenses')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable_expenses'] });
      toast({ title: 'Success', description: 'Expense updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

export const useDeleteVariableExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('variable_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable_expenses'] });
      toast({ title: 'Success', description: 'Expense deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

// Savings Goals hooks
export const useSavingsGoals = () => {
  return useQuery({
    queryKey: ['savings_goals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) return [];
      
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('profile_id', activeProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useAddSavingsGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (goal: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) throw new Error('No active profile');
      
      const { error } = await supabase.from('savings_goals').insert({
        user_id: user.id,
        profile_id: activeProfile.id,
        ...goal
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
      toast({ title: 'Success', description: 'Goal created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

export const useUpdateSavingsGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
      toast({ title: 'Success', description: 'Goal updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

export const useDeleteSavingsGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
      toast({ title: 'Success', description: 'Goal deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};

// Savings hooks
export const useSavings = () => {
  return useQuery({
    queryKey: ['savings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) return null;
      
      const { data, error } = await supabase
        .from('savings')
        .select('*')
        .eq('profile_id', activeProfile.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });
};

export const useUpdateSavings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Get active profile
      const { data: activeProfile } = await supabase
        .from('financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeProfile) throw new Error('No active profile');
      
      const { data: existing } = await supabase
        .from('savings')
        .select('id')
        .eq('profile_id', activeProfile.id)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('savings')
          .update(updates)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('savings')
          .insert({ user_id: user.id, profile_id: activeProfile.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      toast({ title: 'Success', description: 'Savings updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
};
