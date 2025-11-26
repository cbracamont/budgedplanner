import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialMetric {
  label: string;
  value: string;
  count?: number;
}

export interface UpcomingPayment {
  name: string;
  amount: number;
  date: number;
  type: string;
  label: string;
}

export interface FinancialInsights {
  status: 'healthy' | 'concern' | 'critical';
  statusMessage: string;
  metrics: FinancialMetric[];
  upcomingPayments: UpcomingPayment[];
}

export const useFinancialInsights = (profileId: string | undefined, language: string = 'en') => {
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (!profileId) {
      setInsights(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('financial-insights', {
        body: { profileId, language }
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.insights) {
        setInsights(data.insights);
      } else {
        setInsights(null);
      }
    } catch (err) {
      console.error('Error fetching financial insights:', err);
      setError(err instanceof Error ? err.message : 'Error loading insights');
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [profileId, language]);

  return {
    insights,
    isLoading,
    error,
    refetch: fetchInsights
  };
};