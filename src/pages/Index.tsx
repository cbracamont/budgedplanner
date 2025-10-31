// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, TrendingUp, Printer } from "lucide-react";
import {
  useIncomeSources,
  useDebts,
  useFixedExpenses,
  useVariableExpenses,
  useSavingsGoals,
  useSavings,
} from "@/hooks/useFinancialData";
import { useFinancialProfiles } from "@/hooks/useFinancialProfiles";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { EnhancedFinancialCharts } from "@/components/EnhancedFinancialCharts";
import { BudgetSummary } from "@/components/BudgetSummary";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  useTheme();
  const [language] = useState<"en" | "es">("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // === PERFIL ACTIVO ===
  const { data: profiles = [], isLoading: profileLoading } = useFinancialProfiles();
  const activeProfile = profiles.find((p) => p.is_active);

  // === DATOS ===
  const { data: incomeData = [], isLoading: incomeLoading } = useIncomeSources();
  const { data: debtData = [], isLoading: debtsLoading } = useDebts();
  const { data: fixedExpensesData = [], isLoading: fixedLoading } = useFixedExpenses();
  const { data: variableExpensesData = [], isLoading: variableLoading } = useVariableExpenses();
  const { data: savingsGoalsData = [], isLoading: goalsLoading } = useSavingsGoals();
  const { data: savings, isLoading: savingsLoading } = useSavings();

  const dataLoading =
    incomeLoading ||
    debtsLoading ||
    fixedLoading ||
    variableLoading ||
    goalsLoading ||
    savingsLoading ||
    profileLoading;

  // === CÁLCULOS ===
  const totalIncome = useMemo(() => incomeData.reduce((sum, s) => sum + s.amount, 0), [incomeData]);
  const totalDebts = useMemo(() => debtData.reduce((sum, d) => sum + d.minimum_payment, 0), [debtData]);

  const totalFixedExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    return fixedExpensesData.reduce((sum, exp) => {
      if (exp.frequency_type === "annual" && exp.payment_month === currentMonth) {
        return sum + exp.amount;
      }
      return sum + exp.amount;
    }, 0);
  }, [fixedExpensesData]);

  const totalVariableExpenses = useMemo(
    () => variableExpensesData.reduce((sum, exp) => sum + exp.amount, 0),
    [variableExpensesData],
  );
  const totalActiveSavingsGoals = useMemo(
    () => savingsGoalsData.filter((g) => g.is_active).reduce((sum, g) => sum + (g.monthly_contribution || 0), 0),
    [savingsGoalsData],
  );
  const monthlyEmergencyContribution = savings?.monthly_emergency_contribution || 0;
  const emergencyFund = savings?.emergency_fund || 0;
  const totalSavingsContributions =
    totalActiveSavingsGoals + monthlyEmergencyContribution + (savings?.monthly_goal || 0);
  const emergencyFundTarget = (totalFixedExpenses + totalVariableExpenses) * 4;
  const availableForDebt =
    totalIncome - totalDebts - totalFixedExpenses - totalVariableExpenses - totalSavingsContributions;

  // === FORMAT ===
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // === AUTH ===
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // === IMPRIMIR ===
  const printReport = () => window.print();

  // === RENDER ===
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <>
      {/* ESTILOS DE IMPRESIÓN */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background: white; padding: 20px; }
            .print-title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
            .print-section { margin: 20px 0; }
            .print-row { display: flex; justify-content: space-between; margin: 6px 0; }
            .print-label { font-weight: bold; }
          }
        `}
      </style>

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* CABECERA */}
          <div className="no-print text-center mb-8">
            <div className="flex justify-center items-center gap-3 mb-4 flex-wrap">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <LanguageToggle language={language} onLanguageChange={() => {}} />
              <ProfileSelector language={language} />
              <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                {language === "es" ? "Salir" : "Sign Out"}
              </Button>
            </div>
            <h1 className="text-4xl font-bold">
              {activeProfile?.type === "family" ? "Family Budget" : "Personal Budget"}
            </h1>
          </div>

          {/* BOTÓN IMPRIMIR */}
          <div className="flex justify-end mb-6 no-print">
            <Button onClick={printReport} size="sm">
              <Printer className="mr-2 h-4 w-4" />
              {language === "es" ? "Imprimir" : "Print"}
            </Button>
          </div>

          {/* REPORTE IMPRIMIBLE */}
          <div className="print-title">
            {activeProfile?.type === "family" ? "Family" : "Personal"} Report - {new Date().toLocaleDateString()}
          </div>

          <div className="print-section">
            <h2 className="text-lg font-bold mb-3">Summary</h2>
            <div className="print-row">
              <span className="print-label">Income:</span>
              <span>{formatCurrency(totalIncome)}</span>
            </div>
            <div className="print-row">
              <span className="print-label">Debts:</span>
              <span>{formatCurrency(totalDebts)}</span>
            </div>
            <div className="print-row">
              <span className="print-label">Fixed:</span>
              <span>{formatCurrency(totalFixedExpenses)}</span>
            </div>
            <div className="print-row">
              <span className="print-label">Variable:</span>
              <span>{formatCurrency(totalVariableExpenses)}</span>
            </div>
            <div className="print-row">
              <span className="print-label">Available:</span>
              <span>{formatCurrency(availableForDebt)}</span>
            </div>
            <div className="print-row">
              <span className="print-label">Emergency Fund:</span>
              <span>
                {formatCurrency(emergencyFund)} / {formatCurrency(emergencyFundTarget)}
              </span>
            </div>
          </div>

          <EnhancedFinancialCharts
            totalIncome={totalIncome}
            totalDebts={totalDebts}
            totalFixedExpenses={totalFixedExpenses}
            totalVariableExpenses={totalVariableExpenses}
            totalSavingsAccumulated={emergencyFund}
            language={language}
            chartType="bar"
          />

          {/* DASHBOARD */}
          <div className="no-print space-y-6">
            <Tabs defaultValue="summary">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="debts">Debts</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <BudgetSummary
                  totalIncome={totalIncome}
                  totalDebts={totalDebts}
                  totalFixedExpenses={totalFixedExpenses}
                  totalVariableExpenses={totalVariableExpenses}
                  totalSavingsGoals={totalActiveSavingsGoals}
                  monthlyEmergencyContribution={monthlyEmergencyContribution}
                  language={language}
                />
              </TabsContent>

              <TabsContent value="income">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Income
                    </h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <IncomeManager language={language} />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              <TabsContent value="debts">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full p-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Debts
                    </h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <DebtsManager language={language} />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
