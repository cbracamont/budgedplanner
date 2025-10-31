// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths } from "date-fns";
import {
  TrendingUp,
  Settings,
  AlertCircle,
  Download,
  LogOut,
  Wallet,
  PiggyBank,
  CreditCard,
  Globe,
  Zap,
  DollarSign,
  MessageCircle,
  Send,
  Bot,
} from "lucide-react";
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
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";

type Language = "en" | "es";

// === INGRESOS VARIABLES EN LOCALSTORAGE ===
const useVariableIncome = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("variable_income");
    if (saved) setData(JSON.parse(saved));
    setLoading(false);
  }, []);

  const addIncome = (amount: number, description: string) => {
    const newEntry = {
      id: Date.now().toString(),
      amount,
      description: description || "Extra income",
      date: new Date().toISOString(),
    };
    const updated = [newEntry, ...data];
    setData(updated);
    localStorage.setItem("variable_income", JSON.stringify(updated));
  };

  return { data, loading, addIncome };
};

// === AI ASSISTANT ===
const useAIFinancialAssistant = (calculations: any, debtStrategy: any) => {
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "Hello! I'm your UK Financial Coach. Ask me anything!" },
  ]);
  const [input, setInput] = useState("");

  const getAdvice = (q: string) => {
    const net = calculations.netCashFlow;
    const savingsRate = calculations.savingsRate;
    const debtMonths = debtStrategy.totalMonths;

    if (q.includes("debt")) return `Pay off in **${debtMonths} months** using **${debtStrategy.method}**.`;
    if (q.includes("emergency")) return `Emergency fund: **${calculations.emergencyProgress.toFixed(0)}%** of target.`;
    if (q.includes("save")) return `Savings rate: **${savingsRate.toFixed(0)}%**. Aim for 20%.`;
    if (q.includes("cash"))
      return net >= 0 ? `Positive cash flow: **£${net.toFixed(0)}**` : `Cut £${Math.abs(net).toFixed(0)} in expenses.`;
    return "Ask about debt, savings, or cash flow!";
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      { role: "assistant", content: getAdvice(input) },
    ]);
    setInput("");
  };

  return { messages, input, setInput, sendMessage };
};

// === GRÁFICA CSS: BARRAS ===
const CSSBarChart = ({ data, title }: { data: any[]; title: string }) => {
  const max = Math.max(...data.map((d) => Math.max(d.income, d.expenses)));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-12 text-sm">{d.month}</span>
              <div className="flex-1 flex gap-1 h-8">
                <div
                  className="bg-blue-500 rounded-l"
                  style={{ width: `${(d.income / max) * 100}%` }}
                  title={`Income: £${d.income.toFixed(0)}`}
                />
                <div
                  className="bg-red-500 rounded-r"
                  style={{ width: `${(d.expenses / max) * 100}%` }}
                  title={`Expenses: £${d.expenses.toFixed(0)}`}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// === GRÁFICA CSS: PASTEL ===
const CSSPieChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-64 h-64 mx-auto">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {data.map((d, i) => {
              const percent = (d.value / total) * 100;
              const start = (cumulative / total) * 360;
              cumulative += d.value;
              const end = (cumulative / total) * 360;
              const largeArc = percent > 50 ? 1 : 0;
              const startRad = (start * Math.PI) / 180;
              const endRad = (end * Math.PI) / 180;
              const x1 = 16 + 16 * Math.cos(startRad);
              const y1 = 16 + 16 * Math.sin(startRad);
              const x2 = 16 + 16 * Math.cos(endRad);
              const y2 = 16 + 16 * Math.sin(endRad);
              return <path key={i} d={`M16,16 L${x1},${y1} A16,16 0 ${largeArc},1 ${x2},${y2} Z`} fill={d.color} />;
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
            £{total.toFixed(0)}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
                {d.name}
              </span>
              <span>£{d.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const Index = () => {
  useTheme();
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);

  const { data: profiles = [], isLoading: profileLoading } = useFinancialProfiles();
  const activeProfile = profiles.find((p) => p.is_active) || { type: "personal", name: "Personal" };

  const { data: incomeData = [], isLoading: incomeLoading } = useIncomeSources();
  const { data: debtData = [], isLoading: debtsLoading } = useDebts();
  const { data: fixedExpensesData = [], isLoading: fixedLoading } = useFixedExpenses();
  const { data: variableExpensesData = [], isLoading: variableLoading } = useVariableExpenses();
  const { data: savingsGoalsData = [], isLoading: goalsLoading } = useSavingsGoals();
  const { data: savings, isLoading: savingsLoading } = useSavings();
  const { data: variableIncome = [], addIncome } = useVariableIncome();

  const dataLoading =
    incomeLoading ||
    debtsLoading ||
    fixedLoading ||
    variableLoading ||
    goalsLoading ||
    savingsLoading ||
    profileLoading;

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

    const forecast = Array.from({ length: 6 }, (_, i) => {
      const month = addMonths(new Date(), i);
      const projectedIncome = netIncome * (1 + 0.02 * i);
      const projectedExpenses = totalExpenses * (1 + 0.01 * i);
      return { month: format(month, "MMM"), income: projectedIncome, expenses: projectedExpenses };
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

  const debtStrategy = useMemo(() => {
    if (debtData.length === 0) return { method: "none", totalMonths: 0, comparison: {} };
    const debts = debtData.map((d) => ({ ...d, remaining: d.balance }));
    const extraMonthly = 200;

    const simulate = (debts: any[], strategy: string) => {
      let remaining = [...debts];
      let month = 1;
      while (remaining.some((d) => d.remaining > 0)) {
        remaining = remaining.map((d) => {
          if (d.remaining <= 0) return d;
          const interest = d.remaining * (d.apr / 100 / 12);
          let payment = Math.max(d.minimum_payment, interest);
          if (
            (strategy === "avalanche" && remaining[0].apr === d.apr) ||
            (strategy === "snowball" && remaining[0].balance === d.balance)
          ) {
            payment += extraMonthly;
          }
          const newRemaining = d.remaining + interest - payment;
          return { ...d, remaining: newRemaining > 0 ? newRemaining : 0 };
        });
        remaining = remaining.filter((d) => d.remaining > 0);
        month++;
      }
      return { totalMonths: month - 1 };
    };

    const avalanche = simulate(debts, "avalanche");
    const snowball = simulate(debts, "snowball");
    const best = avalanche.totalMonths < snowball.totalMonths ? avalanche : snowball;
    const method = best === avalanche ? "avalanche" : "snowball";

    return { method, totalMonths: best.totalMonths, comparison: { avalanche, snowball } };
  }, [debtData]);

  const alerts = useMemo(() => {
    const list = [];
    if (calculations.debtToIncome > 36) list.push({ type: "error", message: "Debt-to-income over 36%" });
    if (calculations.savingsRate < 20) list.push({ type: "warning", message: "Savings below 20%" });
    if (calculations.emergencyProgress < 50) list.push({ type: "info", message: "Emergency fund under 50%" });
    if (calculations.netCashFlow < 0) list.push({ type: "error", message: "Negative cash flow" });
    return list;
  }, [calculations]);

  const { messages, input, setInput, sendMessage } = useAIFinancialAssistant(calculations, debtStrategy);

  const formatCurrency = (amount: number) => `£${amount.toFixed(0)}`;

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

  const pieData = [
    { name: "Fixed", value: calculations.totalFixed, color: "#3b82f6" },
    { name: "Variable", value: calculations.totalVariable, color: "#10b981" },
    { name: "Debt", value: calculations.totalMinimumPayments, color: "#ef4444" },
    { name: "Savings", value: calculations.totalGoalContributions, color: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* HEADER */}
          <div className="no-print flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UK Personal Finance
              </h1>
              <p className="text-muted-foreground">Your Financial Coach</p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle language={language} onLanguageChange={setLanguage} />
              <ProfileSelector language={language} />
              <Button variant="outline" size="icon" onClick={exportPDF}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowAI(true)}>
                <Bot className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => supabase.auth.signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ALERTS */}
          {alerts.length > 0 && (
            <div className="no-print space-y-3">
              {alerts.map((alert, i) => (
                <Alert key={i} variant={alert.type === "error" ? "destructive" : "default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{alert.type === "error" ? "Urgent" : "Advice"}</AlertTitle>
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
                  +{formatCurrency(calculations.totalVariableIncome)} extra
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

          {/* GRÁFICAS CSS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
            <CSSBarChart data={calculations.forecast} title="6-Month Forecast" />
            {pieData.length > 0 && <CSSPieChart data={pieData} />}
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
              <Card>
                <CardHeader>
                  <CardTitle>Financial Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-bold text-center text-blue-600">
                    {(85 - calculations.debtToIncome + calculations.savingsRate).toFixed(0)}
                  </div>
                  <Progress value={85 - calculations.debtToIncome + calculations.savingsRate} className="mt-4" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="income">
              <div className="space-y-6">
                <IncomeManager language={language} />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Extra Income
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
                            addIncome(val, "Freelance");
                            input.value = "";
                          }
                        }}
                      >
                        Add
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
                        Best Strategy: {debtStrategy.method.toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        Pay off in <strong>{debtStrategy.totalMonths} months</strong>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-red-50 rounded">
                          <p className="font-bold">Avalanche</p>
                          <p>{debtStrategy.comparison.avalanche.totalMonths} mo</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded">
                          <p className="font-bold">Snowball</p>
                          <p>{debtStrategy.comparison.snowball.totalMonths} mo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="forecast">
              <CSSBarChart data={calculations.forecast} title="6-Month Cash Flow" />
            </TabsContent>
          </Tabs>

          {/* AI ASSISTANT */}
          {showAI && (
            <div
              className="no-print fixed bottom-4 right-4 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col"
              style={{ height: "500px" }}
            >
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <Bot className="h-5 w-5" /> UK Coach
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setShowAI(false)}>
                  ×
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700"}`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Ask about debt, savings..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button size="icon" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
