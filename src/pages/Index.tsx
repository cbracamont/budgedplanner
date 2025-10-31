// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths } from "date-fns";
import {
  TrendingUp,
  Settings,
  AlertCircle,
  CheckCircle2,
  Download,
  LogOut,
  Wallet,
  PiggyBank,
  CreditCard,
  Globe,
  Zap,
  DollarSign,
} from "lucide-react";
import {
  useIncomeSources,
  useDebts,
  useFixedExpenses,
  useVariableExpenses,
  useSavingsGoals,
  useSavings,
} from "@/hooks/useFinancialData";
import { useVariableIncome } from "@/hooks/useVariableIncome";
import { useFinancialProfiles } from "@/hooks/useFinancialProfiles";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";

type Language = "en" | "es";

const Index = () => {
  useTheme();
  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<"GBP" | "USD">("GBP");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // === PERFIL ACTIVO ===
  const { data: profiles = [], isLoading: profileLoading } = useFinancialProfiles();
  const activeProfile = profiles.find((p) => p.is_active) || { type: "personal", name: "Personal" };

  // === DATOS FINANCIEROS ===
  const { data: incomeData = [], isLoading: incomeLoading } = useIncomeSources();
  const { data: debtData = [], isLoading: debtsLoading } = useDebts();
  const { data: fixedExpensesData = [], isLoading: fixedLoading } = useFixedExpenses();
  const { data: variableExpensesData = [], isLoading: variableLoading } = useVariableExpenses();
  const { data: savingsGoalsData = [], isLoading: goalsLoading } = useSavingsGoals();
  const { data: savings, isLoading: savingsLoading } = useSavings();
  const { data: variableIncome = [], isLoading: varIncLoading, addIncome } = useVariableIncome();

  const dataLoading =
    incomeLoading ||
    debtsLoading ||
    fixedLoading ||
    variableLoading ||
    goalsLoading ||
    savingsLoading ||
    profileLoading ||
    varIncLoading;

  // === CÁLCULOS FINANCIEROS ===
  const calculations = useMemo(() => {
    const totalIncome = incomeData.reduce((sum, s) => sum + s.amount, 0);
    const totalVariableIncome = variableIncome.reduce((sum, i) => sum + i.amount, 0);
    const netIncome = totalIncome + totalVariableIncome;

    const totalDebtBalance = debtData.reduce((sum, d) => sum + d.balance, 0);
    const totalMinimumPayments = debtData.reduce((sum, d) => sum + d.minimum_payment, 0);

    const currentMonth = new Date().getMonth() + 1;
    const totalFixed = fixedExpensesData.reduce((sum, exp) => {
      if (exp.frequency_type === "annual" && exp.payment_month === currentMonth) return sum + exp.amount;
      return sum + exp.amount;
    }, 0);

    const totalVariable = variableExpensesData.reduce((sum, exp) => sum + exp.amount, 0);
    const activeGoals = savingsGoalsData.filter((g) => g.is_active);
    const totalGoalContributions = activeGoals.reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);
    const emergencyTarget = (totalFixed + totalVariable) * 6;
    const emergencyProgress = savings?.emergency_fund ? (savings.emergency_fund / emergencyTarget) * 100 : 0;

    const totalExpenses =
      totalFixed + totalVariable + totalMinimumPayments + totalGoalContributions + (savings?.monthly_goal || 0);
    const netCashFlow = netIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (totalGoalContributions / totalIncome) * 100 : 0;
    const debtToIncome = totalIncome > 0 ? (totalMinimumPayments / totalIncome) * 100 : 0;

    // === FORECAST SIN ERROR ===
    const forecast = Array.from({ length: 12 }, (_, i) => {
      const month = addMonths(new Date(), i);
      const projectedIncome = netIncome * (1 + 0.02 * i);
      const projectedExpenses = totalExpenses * (1 + 0.01 * i);
      const projectedSavings = projectedIncome - projectedExpenses;

      let cumulative = savings?.emergency_fund || 0;
      for (let j = 0; j < i; j++) {
        const prevIncome = netIncome * (1 + 0.02 * j);
        const prevExpenses = totalExpenses * (1 + 0.01 * j);
        cumulative += prevIncome - prevExpenses;
      }
      cumulative += projectedSavings;

      return { month, income: projectedIncome, expenses: projectedExpenses, savings: projectedSavings, cumulative };
    });

    return {
      totalIncome,
      totalVariableIncome,
      netIncome,
      totalDebtBalance,
      totalMinimumPayments,
      totalFixed,
      totalVariable,
      totalExpenses,
      netCashFlow,
      savingsRate,
      debtToIncome,
      emergencyTarget,
      emergencyProgress,
      totalGoalContributions,
      forecast,
    };
  }, [incomeData, variableIncome, debtData, fixedExpensesData, variableExpensesData, savingsGoalsData, savings]);

  // === ESTRATEGIA DE PAGO: AVALANCHE + SNOWBALL + HYBRID ===
  const debtStrategy = useMemo(() => {
    if (debtData.length === 0) return { method: "none", payments: [], totalMonths: 0, comparison: {} };

    const debts = debtData.map((d) => ({
      ...d,
      remaining: d.balance,
      totalPaid: 0,
    }));

    const extraMonthly = 200; // £200 extra al mes

    const simulate = (debts: typeof debts, strategy: "avalanche" | "snowball" | "hybrid") => {
      let remaining = [...debts];
      const payments: any[] = [];
      let month = 1;

      while (remaining.some((d) => d.remaining > 0)) {
        let totalPaid = 0;
        let currentMonth = remaining.map((d) => {
          if (d.remaining <= 0) return { ...d, payment: 0 };

          const interest = d.remaining * (d.apr / 100 / 12);
          const minPayment = Math.max(d.minimum_payment, interest);
          let payment = minPayment;

          const isTarget =
            strategy === "avalanche"
              ? remaining[0].apr === d.apr
              : strategy === "snowball"
                ? remaining[0].balance === d.balance
                : strategy === "hybrid"
                  ? remaining.length > 2
                    ? remaining[0].balance === d.balance
                    : remaining[0].apr === d.apr
                  : false;

          if (isTarget) payment += extraMonthly;

          const newRemaining = d.remaining + interest - payment;
          totalPaid += payment;

          return {
            ...d,
            payment,
            remaining: newRemaining > 0 ? newRemaining : 0,
          };
        });

        payments.push({
          month,
          totalPaid,
          debts: currentMonth.map((d) => ({ name: d.name, payment: d.payment, remaining: d.remaining })),
        });

        remaining = currentMonth.filter((d) => d.remaining > 0);
        month++;
      }

      const totalInterest = payments.reduce(
        (sum, p) => sum + p.debts.reduce((acc: number, d: any) => acc + d.remaining * (d.apr / 100 / 12), 0),
        0,
      );

      return { payments, totalMonths: month - 1, totalInterest };
    };

    const avalanche = simulate(debts, "avalanche");
    const snowball = simulate(debts, "snowball");
    const hybrid = simulate(debts, "hybrid");

    const best = [avalanche, snowball, hybrid].sort((a, b) => a.totalMonths - b.totalMonths)[0];
    const method = best === avalanche ? "avalanche" : best === snowball ? "snowball" : "hybrid";

    return {
      method,
      payments: best.payments,
      totalMonths: best.totalMonths,
      totalInterest: best.totalInterest,
      comparison: { avalanche, snowball, hybrid },
    };
  }, [debtData]);

  // === ALERTAS ===
  const alerts = useMemo(() => {
    const list = [];
    if (calculations.debtToIncome > 36) list.push({ type: "error", message: "Debt-to-income >36%" });
    if (calculations.savingsRate < 20) list.push({ type: "warning", message: "Savings rate <20%" });
    if (calculations.emergencyProgress < 50) list.push({ type: "info", message: "Emergency fund <50%" });
    if (calculations.netCashFlow < 0) list.push({ type: "error", message: "Negative cash flow" });
    return list;
  }, [calculations]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "es" ? "es-ES" : "en-GB", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const exportPDF = () => window.print();

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
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
            body { background: white !important; }
          }
        `}
      </style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* HEADER */}
          <div className="no-print">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {activeProfile.type === "family" ? "Family Budget UK" : "Personal Finance"}
                </h1>
                <p className="text-muted-foreground mt-2">Financial Intelligence Dashboard</p>
              </div>
              <div className="flex items-center gap-3">
                <LanguageToggle language={language} onLanguageChange={(lang: Language) => setLanguage(lang)} />
                <ProfileSelector language={language} />
                <Button variant="outline" size="icon" onClick={exportPDF}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => supabase.auth.signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* ALERTAS */}
          {alerts.length > 0 && (
            <div className="no-print space-y-3">
              {alerts.map((alert, i) => (
                <Alert key={i} variant={alert.type === "error" ? "destructive" : "default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{alert.type === "error" ? "Critical" : "Warning"}</AlertTitle>
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(calculations.netIncome)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatCurrency(calculations.totalVariableIncome)} variable
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Debt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(calculations.totalDebtBalance)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Emergency Fund</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(savings?.emergency_fund || 0)}</div>
                <Progress value={calculations.emergencyProgress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${calculations.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(calculations.netCashFlow)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TABS */}
          <Tabs defaultValue="overview" className="no-print">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="debts">Debts</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-6xl font-bold text-center">
                      {(85 - calculations.debtToIncome + calculations.savingsRate).toFixed(0)}
                    </div>
                    <Progress value={85 - calculations.debtToIncome + calculations.savingsRate} className="mt-4" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="income">
              <div className="space-y-6">
                <IncomeManager language={language} />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Ingresos Variables (Este mes)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        placeholder="£500"
                        className="flex-1 px-3 py-2 border rounded-lg"
                        id="variable-income-input"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById("variable-income-input") as HTMLInputElement;
                          const val = parseFloat(input.value);
                          if (val > 0) {
                            addIncome(val, "Freelance / Bonus");
                            input.value = "";
                          }
                        }}
                      >
                        Agregar
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency(calculations.totalVariableIncome)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="expenses">
              <div className="space-y-6">
                <FixedExpensesManager language={language} />
                <VariableExpensesManager language={language} />
              </div>
            </TabsContent>

            <TabsContent value="debts">
              <div className="space-y-6">
                <DebtsManager language={language} />

                {debtData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Estrategia Óptima:{" "}
                        {debtStrategy.method === "avalanche"
                          ? "Avalanche"
                          : debtStrategy.method === "snowball"
                            ? "Snowball"
                            : "Hybrid"}
                      </CardTitle>
                      <CardDescription>
                        Pagas en <strong>{debtStrategy.totalMonths} meses</strong> • Ahorras{" "}
                        <strong>
                          £{Math.round(debtStrategy.comparison.avalanche.totalInterest - debtStrategy.totalInterest)}
                        </strong>{" "}
                        vs Avalanche
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="font-medium text-red-700 dark:text-red-400">Avalanche</p>
                          <p className="text-sm">{debtStrategy.comparison.avalanche.totalMonths} meses</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="font-medium text-green-700 dark:text-green-400">Snowball</p>
                          <p className="text-sm">{debtStrategy.comparison.snowball.totalMonths} meses</p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="font-medium text-blue-700 dark:text-blue-400">Hybrid</p>
                          <p className="text-sm">{debtStrategy.comparison.hybrid.totalMonths} meses</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="font-medium">Próximos 3 meses:</p>
                        {debtStrategy.payments.slice(0, 3).map((p, i) => (
                          <div key={i} className="flex justify-between p-2 bg-muted/50 rounded">
                            <span>Mes {p.month}</span>
                            <span className="font-medium">{formatCurrency(p.totalPaid)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="forecast">
              <Card>
                <CardHeader>
                  <CardTitle>12-Month Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {calculations.forecast.map((m, i) => (
                      <div key={i} className="flex justify-between p-3 bg-muted/50 rounded">
                        <span>{format(m.month, "MMM yyyy")}</span>
                        <span className={m.savings >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(m.savings)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* SETTINGS */}
          <Card className="no-print mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <span>Currency</span>
                </div>
                <Button size="sm" onClick={() => setCurrency((c) => (c === "GBP" ? "USD" : "GBP"))}>
                  {currency}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Index;
