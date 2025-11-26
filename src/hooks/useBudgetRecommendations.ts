import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BudgetAllocation {
  category: string;
  amount: number;
  target_id?: string;
  target_type?: 'debt' | 'savings_goal' | 'emergency_fund';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  allocations: BudgetAllocation[];
  total_amount: number;
}

export const useBudgetRecommendations = (profileId: string | undefined, language: string = 'en') => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!profileId) {
      setRecommendations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('budget-recommendations', {
        body: { language }
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Error fetching budget recommendations:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar recomendaciones');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [profileId, language]);

  return {
    recommendations,
    isLoading,
    error,
    refetch: fetchRecommendations
  };
};
