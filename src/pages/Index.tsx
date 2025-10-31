// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths } from "date-fns";
import {
  TrendingUp, TrendingDown, Calendar, DollarSign,
  Settings, AlertCircle, CheckCircle2, Download, LogOut,
  Wallet, PiggyBank, CreditCard, ShoppingCart, Heart, Zap, Globe, Bell
} from "lucide-react";
import {
  useIncomeSources,
  useDebts,
  useFixedExpenses,
  useVariableExpenses,
  useSavingsGoals,
  useSavings
} from "@/hooks/useFinancialData";
import { useFinancialProfiles } from "@/hooks/useFinancialProfiles";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
import { EmergencyFundManager } from "@/components/EmergencyFundManager";
import { GeneralSavingsManager } from "@/components/GeneralSavingsManager";
import { EnhancedFinancialCharts } from "@/components/EnhancedFinancialCharts";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  useTheme();
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('GBP');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // === PERFIL ACTIVO ===
  const { data: profiles = [], isLoading: profileLoading } = useFinancialProfiles();
  const activeProfile = profiles.find(p => p.is_active) || { type: 'personal', name: 'Personal' };

  // === DATOS FINANCIEROS ===
  const { data: incomeData = [], isLoading: incomeLoading } = useIncomeSources();
  const { data: debtData = [], isLoading: debtsLoading } = useDebts();
  const { data: fixedExpensesData = [], isLoading: fixedLoading } = useFixedExpenses();
  const { data: variableExpensesData = [], isLoading: variableLoading } = useVariableExpenses();
  const { data: savingsGoalsData = [], isLoading: goalsLoading } = useSavingsGoals();
  const { data: savings, isLoading: savingsLoading } = useSavings();

  const dataLoading = incomeLoading || debtsLoading || fixedLoading || variableLoading || goalsLoading || savingsLoading || profileLoading;

  // === CÁLCULOS FINANCIEROS AVANZADOS ===
  const calculations = useMemo(() => {
    const totalIncome = incomeData.reduce((sum, s) => sum + s.amount, 0);
    const netIncome = incomeData.reduce((sum, s) => sum + (s.amount * (1 - (s.tax_rate || 0) / 100)), 0);
    const totalDebtBalance = debtData.reduce((sum, d) => sum + d.balance, 0);
    const totalMinimumPayments = debtData.reduce((sum, d) => sum + d.minimum_payment, 0);
    const totalInterest = debtData.reduce((sum, d) => sum + (d.balance * (d.interest_rate / 100 / 12)), 0);

    const currentMonth = new Date().getMonth() + 1;
    const totalFixed = fixedExpensesData.reduce((sum, exp) => {
      if (exp.frequency_type === 'annual' && exp.payment_month === currentMonth) return sum + exp.amount;
      return sum + exp.amount;
    }, 0);

    const totalVariable = variableExpensesData.reduce((sum, exp) => sum + exp.amount, 0);
    const activeGoals = savingsGoalsData.filter(g => g.is_active);
    const totalGoalContributions = activeGoals.reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);
    const emergencyTarget = (totalFixed + totalVariable) * 6;
    const emergencyProgress = savings?.emergency_fund ? (savings.emergency_fund / emergencyTarget) * 100 : 0;

    const totalExpenses = totalFixed + totalVariable + totalMinimumPayments + totalGoalContributions + (savings?.monthly_goal || 0);
    const netCashFlow = netIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (totalGoalContributions / totalIncome) * 100 : 0;
    const debtToIncome = totalIncome > 0 ? (totalMinimumPayments / totalIncome) * 100 : 0;

    const forecast = Array.from({ length: 12 }, (_, i) => {
      const month = addMonths(new Date(), i);
      const projectedIncome = netIncome * (1 + 0.02 * i);
      const projectedExpenses = totalExpenses * (1 + 0.01 * i);
      const projectedSavings = projectedIncome - projectedExpenses;
      const cumulative = i === 0 ? savings?.emergency_fund || 0 : forecast[i - 1].cumulative + projectedSavings;
      return { month, income: projectedIncome, expenses: projectedExpenses, savings: projectedSavings, cumulative };
    });

    return {
      totalIncome,
      netIncome,
      totalDebtBalance,
      totalMinimumPayments,
      totalInterest,
      totalFixed,
      totalVariable,
      totalExpenses,
      netCashFlow,
      savingsRate,
      debtToIncome,
      emergencyTarget,
      emergencyProgress,
      totalGoalContributions,
      forecast
    };
  }, [incomeData, debtData, fixedExpensesData, variableExpensesData, savingsGoalsData, savings]);

  // === ALERTAS INTELIGENTES ===
  const alerts = useMemo(() => {
    const list = [];
    if (calculations.debtToIncome > 36) list.push({ type: 'error', message: 'Debt-to-income ratio >36% - High risk' });
    if (calculations.savingsRate < 20) list.push({ type: 'warning', message: 'Savings rate <20% - Increase contributions' });
    if (calculations.emergencyProgress < 50) list.push({ type: 'info', message: 'Emergency fund <50% of target' });
    if (calculations.netCashFlow < 0) list.push({ type: 'error', message: 'Negative cash flow - Reduce expenses' });
    return list;
  }, [calculations]);