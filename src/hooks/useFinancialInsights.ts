import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialMetric {
  key?: string;
  label: string;
  /** Raw numeric value, formatted on the client so it respects the user's currency. */
  amount?: number;
  format?: 'currency' | 'percent';
  /** Legacy pre-formatted value (older function responses). */
  value?: string;
  count?: number;
}

export interface UpcomingPayment {
  name: string;
  amount: number;
  /** Day of the month the payment is due. */
  date: number;
  type: string;
  daysUntil?: number;
  label?: string;
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

  const fetchInsights = useCallback(async () => {
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
  }, [profileId, language]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    isLoading,
    error,
    refetch: fetchInsights
  };
};
