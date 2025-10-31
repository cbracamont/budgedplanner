// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths } from "date-fns";
import { TrendingUp, AlertCircle, Download, LogOut, Bot, X, DollarSign, Zap, Send } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Language = "en" | "es";

// === INGRESOS VARIABLES ===
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

  const deleteIncome = (id: string) => {
    const updated = data.filter((i) => i.id !== id);
    setData(updated);
    localStorage.setItem("variable_income", JSON.stringify(updated));
  };

  return { data, loading, addIncome, deleteIncome };
};

// === CONFIRMACIÓN DE ELIMINACIÓN ===
const useDeleteConfirmation = () => {
  const [open, setOpen] = useState(false);
  const [onConfirm, setOnConfirm] = useState<() => void>(() => {});

  const confirmDelete = (callback: () => void) => {
    setOnConfirm(() => callback);
    setOpen(true);
  };

  return { open, setOpen, onConfirm, confirmDelete };
};

// === AI EDUCATIVO + CERRABLE ===
const useAIFinancialAssistant = (calculations: any, debtStrategy: any, debtData: any[], activeProfile: any) => {
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: `Hello ${activeProfile.name || "there"}! I'm your **UK Financial Coach**. Ask me anything.`,
      closable: true,
    },
  ]);
  const [input, setInput] = useState("");

  const formatCurrency = (amount: number) => `£${amount.toFixed(0)}`;

  const getAdvice = (question: string) => {
    const q = question.toLowerCase().trim();
    const { netCashFlow, savingsRate, emergencyProgress, totalDebtBalance, totalFixed, totalVariable } = calculations;
    const highInterestDebt = [...debtData].sort((a, b) => b.apr - a.apr)[0];
    const extraForDebt = Math.min(200, netCashFlow * 0.4);

    if (q.includes("qué hago") || q.includes("plan") || q.includes("what should")) {
      return {
        content: `
**Your Monthly Action Plan**

1. **Pay Debt** → **${formatCurrency(extraForDebt)}** to **${highInterestDebt?.name || "highest APR"}**  
   *Saves £${((extraForDebt * (highInterestDebt?.apr || 20)) / 100 / 12).toFixed(0)} in interest*

2. **Save** → **${formatCurrency(netCashFlow - extraForDebt)}** to emergency fund  
   *Progress: ${emergencyProgress.toFixed(0)}%*

3. **Cut** → Reduce dining out by **£50**

**Result:** Debt ↓ | Safety ↑ | Stress ↓
        `.trim(),
        closable: true,
      };
    }

    // ... (otros casos igual, todos con closable: true)

    return {
      content: "Ask me: 'What should I do?', 'Can I spend £300?', 'How to get out of debt?'",
      closable: true,
    };
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input, closable: false };
    const aiMsg = { ...getAdvice(input), role: "assistant" };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  const closeMessage = (index: number) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  };

  return { messages, input, setInput, sendMessage, closeMessage };
};

// === GRÁFICAS CSS (sin cambios) ===
const CSSBarChart = ({ data, title }: { data: any[]; title: string }) => {
  const max = Math.max(...data.map((d) => Math.max(d.income, d.expenses)));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 6).map((d, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-12 text-sm">{d.month}</span>
              <div className="flex-1 flex gap-1 h-8">
                <div className="bg-blue-500 rounded-l" style={{ width: `${(d.income / max) * 100}%` }} />
                <div className="bg-red-500 rounded-r" style={{ width: `${(d.expenses / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

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
  const activeProfile = profiles.find((p) => p.is_active) || { type: "personal", name: "User" };

  const { data: incomeData = [], isLoading: incomeLoading } = useIncomeSources();
  const { data: debtData = [], isLoading: debtsLoading } = useDebts();
  const { data: fixedExpensesData = [], isLoading: fixedLoading } = useFixedExpenses();
  const { data: variableExpensesData = [], isLoading: variableLoading } = useVariableExpenses();
  const { data: savingsGoalsData = [], isLoading: goalsLoading } = useSavingsGoals();
  const { data: savings, isLoading: savingsLoading } = useSavings();
  const { data: variableIncome = [], addIncome, deleteIncome } = useVariableIncome();

  const { open: deleteOpen, setOpen: setDeleteOpen, onConfirm, confirmDelete } = useDeleteConfirmation();

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

  const { messages, input, setInput, sendMessage, closeMessage } = useAIFinancialAssistant(
    calculations,
    {},
    debtData,
    activeProfile,
  );

  const formatCurrency = (amount: number) => `£${amount.toFixed(0)}`;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
  }, []);

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
      <style>{`@media print { .no-print, footer { display: none !important; } }`}</style>

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
              <LanguageToggle language={language} onLanguageChange={(lang: Language) => setLanguage(lang)} />
              <ProfileSelector language={language} />
              <Button variant="outline" size="icon" onClick={() => window.print()}>
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
            {/* ... otros cards ... */}
          </div>

          {/* GRÁFICAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
            <CSSBarChart data={calculations.forecast} title="6-Month Forecast" />
            {pieData.length > 0 && <CSSPieChart data={pieData} />}
          </div>

          {/* TABS */}
          <Tabs defaultValue="overview" className="no-print">
            {/* ... tabs ... */}
            <TabsContent value="income">
              <div className="space-y-6">
                <IncomeManager
                  language={language}
                  onDelete={(id) =>
                    confirmDelete(() => {
                      /* delete logic */
                    })
                  }
                />
                {/* Variable Income con confirmación */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Extra Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {variableIncome.map((inc) => (
                      <div key={inc.id} className="flex justify-between items-center p-2 border-b">
                        <span>
                          {inc.description}: {formatCurrency(inc.amount)}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => confirmDelete(() => deleteIncome(inc.id))}>
                          Delete
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* AI CHAT */}
          {showAI && (
            <div
              className="no-print fixed bottom-4 right-4 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col"
              style={{ height: "560px" }}
            >
              <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                <h3 className="font-bold flex items-center gap-2">
                  <Bot className="h-5 w-5" /> Financial Coach
                </h3>
                <Button size="sm" variant="ghost" className="text-white" onClick={() => setShowAI(false)}>
                  ×
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} relative`}>
                    <div
                      className={`max-w-xs px-4 py-3 rounded-2xl whitespace-pre-wrap text-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700"}`}
                    >
                      {m.content}
                      {m.closable && (
                        <button
                          onClick={() => closeMessage(i)}
                          className="absolute top-1 right-1 text-xs opacity-60 hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Ask anything..."
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

          {/* DISCLAIMER LEGAL */}
          <footer className="no-print py-8 text-center text-xs text-muted-foreground border-t mt-12">
            <p className="font-semibold mb-2">⚖️ Legal Disclaimer (UK)</p>
            <p>
              This app provides general financial education and tools for personal use. It is{" "}
              <strong>not financial advice</strong>. All recommendations are algorithmic and based on user-input data.
              You are solely responsible for your financial decisions. We are not liable for any loss or damage. For
              personalized advice, consult a qualified financial adviser regulated by the FCA.
            </p>
            <p className="mt-2">© 2025 UK Personal Finance App. All rights reserved.</p>
          </footer>
        </div>
      </div>

      {/* CONFIRMACIÓN DE ELIMINACIÓN */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete this item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirm();
                setDeleteOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Index;
