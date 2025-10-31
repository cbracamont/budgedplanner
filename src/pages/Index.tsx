// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, TrendingUp, Printer, Calendar, Settings, DollarSign } from "lucide-react";
import {
  useIncomeSources,
  useDebts,
  useFixedExpenses,
  useVariableExpenses,
  useSavingsGoals,
  useSavings,
} from "@/hooks/useFinancialData";
import { useCategoryNames } from "@/hooks/useCategoryNames";
import { useFinancialProfiles } from "@/hooks/useFinancialProfiles";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
import { EmergencyFundManager } from "@/components/EmergencyFundManager";
import { GeneralSavingsManager } from "@/components/GeneralSavingsManager";
import { EnhancedFinancialCharts } from "@/components/EnhancedFinancialCharts";
import { BudgetSummary } from "@/components/BudgetSummary";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, LogOut, Bell, Globe, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const Index = () => {
  useTheme();
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [currency, setCurrency] = useState<"USD" | "GBP">("USD");
  const [notifications, setNotifications] = useState(true);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: currency,
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

  const printReport = () => window.print();

  // === PRONÓSTICO 12 MESES ===
  const forecast = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = addMonths(new Date(), i);
      const income = totalIncome;
      const expenses = totalFixedExpenses + totalVariableExpenses;
      const savings = totalSavingsContributions;
      const net = income - expenses - savings;
      const cumulative = i === 0 ? emergencyFund : months[i - 1].cumulative + net;
      months.push({ date, income, expenses, savings, net, cumulative });
    }
    return months;
  }, [totalIncome, totalFixedExpenses, totalVariableExpenses, totalSavingsContributions, emergencyFund]);

  // === EVENTOS DEL CALENDARIO ===
  const calendarEvents = useMemo(() => {
    const events: { date: Date; title: string; type: "debt" | "fixed" | "income" }[] = [];

    debtData.forEach((d) => {
      if (d.due_date) {
        const due = new Date(d.due_date);
        events.push({ date: due, title: `${d.name}: ${formatCurrency(d.minimum_payment)}`, type: "debt" });
      }
    });

    fixedExpensesData.forEach((exp) => {
      if (exp.payment_month) {
        const year = new Date().getFullYear();
        const due = new Date(year, exp.payment_month - 1, 15);
        events.push({ date: due, title: `${exp.name}: ${formatCurrency(exp.amount)}`, type: "fixed" });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [debtData, fixedExpensesData]);

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
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background: white; padding: 20px; }
            .print-title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
            .print-section { margin: 20px 0; page-break-inside: avoid; }
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
              <LanguageToggle language={language} onLanguageChange={setLanguage} />
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

          {/* REPORTE */}
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

          {/* GRÁFICO */}
          <EnhancedFinancialCharts
            totalIncome={totalIncome}
            totalDebts={totalDebts}
            totalFixedExpenses={totalFixedExpenses}
            totalVariableExpenses={totalVariableExpenses}
            totalSavingsAccumulated={emergencyFund}
            language={language}
            chartType="bar"
          />

          {/* DASHBOARD COMPLETO */}
          <div className="no-print space-y-6">
            <Tabs defaultValue="dashboard">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="debts">Debts</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="savings">Savings</TabsTrigger>
                <TabsTrigger value="forecast">Forecast</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
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

              {/* === INCOME === */}
              <TabsContent value="income">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Income Sources
                    </h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <IncomeManager language={language} />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              {/* === DEBTS === */}
              <TabsContent value="debts">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full p-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Debts & Loans
                    </h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <DebtsManager language={language} />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              {/* === EXPENSES === */}
              <TabsContent value="expenses">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Fixed Expenses
                    </h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <FixedExpensesManager language={language} />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl mb-4 mt-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Variable Expenses
                    </h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <VariableExpensesManager language={language} />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              {/* === SAVINGS === */}
              <TabsContent value="savings">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Emergency Fund
                    </h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <EmergencyFundManager
                      language={language}
                      totalExpenses={totalFixedExpenses + totalVariableExpenses}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full p-4 bg-gradient-to-r from-teal-500 to-green-600 text-white rounded-xl mb-4 mt-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      General Savings
                    </h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <GeneralSavingsManager language={language} availableToSave={availableForDebt} />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              {/* === FORECAST === */}
              <TabsContent value="forecast">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    12-Month Financial Forecast
                  </h2>
                  <div className="space-y-3">
                    {forecast.map((m, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">{format(m.date, "MMM yyyy")}</span>
                        <span className={m.net >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(m.net)} → {formatCurrency(m.cumulative)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* === CALENDARIO === */}
            <div className="mt-8">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Upcoming Payments
                </h2>
                <div className="space-y-2">
                  {calendarEvents.slice(0, 5).map((e, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>
                        {format(e.date, "dd MMM")} - {e.title}
                      </span>
                      <span className={e.type === "debt" ? "text-red-600" : "text-blue-600"}>{e.type}</span>
                    </div>
                  ))}
                  {calendarEvents.length === 0 && <p className="text-muted-foreground">No upcoming payments</p>}
                </div>
              </Card>
            </div>

            {/* === SETTINGS === */}
            <div className="mt-8">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      <span>Language</span>
                    </div>
                    <Button size="sm" onClick={() => setLanguage((prev) => (prev === "en" ? "es" : "en"))}>
                      {language === "en" ? "Español" : "English"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Currency</span>
                    </div>
                    <Button size="sm" onClick={() => setCurrency((prev) => (prev === "USD" ? "GBP" : "USD"))}>
                      {currency}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      <span>Notifications</span>
                    </div>
                    <Button size="sm" onClick={() => setNotifications(!notifications)}>
                      {notifications ? "ON" : "OFF"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
