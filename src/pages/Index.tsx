// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { TrendingUp, Download, LogOut, Calendar, DollarSign, PiggyBank, Home, Edit2, Trash2, Plus } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";

type Language = "en" | "es";
type Event = {
  id: string;
  date: string;
  type: "income" | "debt" | "fixed" | "variable";
  name: string;
  amount: number;
  recurring?: boolean;
};

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

const Index = () => {
  useTheme();
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { data: profiles = [] } = useFinancialProfiles();
  const activeProfile = profiles.find((p) => p.is_active) || { name: "Family" };

  const { data: incomeData = [] } = useIncomeSources();
  const { data: debtData = [] } = useDebts();
  const { data: fixedExpensesData = [] } = useFixedExpenses();
  const { data: variableExpensesData = [] } = useVariableExpenses();
  const { data: savingsGoalsData = [] } = useSavingsGoals();
  const { data: savings } = useSavings();
  const { data: variableIncome = [], addIncome, deleteIncome } = useVariableIncome();

  // === CÁLCULOS FINANCIEROS ===
  const {
    totalIncome,
    totalFixed,
    totalVariable,
    totalDebtPayment,
    totalExpenses,
    cashFlow,
    savingsTotal,
    debtFreeDate,
    monthsToDebtFree,
  } = useMemo(() => {
    const totalIncome = incomeData.reduce((s, i) => s + i.amount, 0) + variableIncome.reduce((s, i) => s + i.amount, 0);
    const totalFixed = fixedExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalVariable = variableExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalDebtPayment = debtData.reduce((s, d) => s + d.minimum_payment, 0);
    const totalExpenses = totalFixed + totalVariable + totalDebtPayment;
    const cashFlow = totalIncome - totalExpenses;

    const savingsTotal =
      (savings?.emergency_fund || 0) + savingsGoalsData.reduce((s, g) => s + (g.current_amount || 0), 0);

    let remaining = debtData.reduce((s, d) => s + d.balance, 0);
    let months = 0;
    const extra = Math.max(0, cashFlow * 0.3);
    const monthlyPay = totalDebtPayment + extra;
    while (remaining > 0 && months < 120) {
      const interest = debtData.reduce((s, d) => s + d.balance * (d.apr / 100 / 12), 0);
      remaining = Math.max(0, remaining + interest - monthlyPay);
      months++;
    }
    const debtFreeDate = addMonths(new Date(), months);

    return {
      totalIncome,
      totalFixed,
      totalVariable,
      totalDebtPayment,
      totalExpenses,
      cashFlow,
      savingsTotal,
      debtFreeDate,
      monthsToDebtFree: months,
    };
  }, [incomeData, variableIncome, fixedExpensesData, variableExpensesData, debtData, savings, savingsGoalsData]);

  const formatCurrency = (amount: number) => `£${amount.toFixed(0)}`;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
  }, []);

  if (authLoading)
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!user) return <Auth />;

  // === CALENDARIO ===
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const blankDays = Array(firstDayOfWeek).fill(null);

  const calendarEvents = useMemo(() => {
    const events: Event[] = [];

    // Ingresos
    incomeData.forEach((inc) => {
      events.push({
        id: `inc-${inc.id}`,
        date: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
        type: "income",
        name: inc.name,
        amount: inc.amount,
        recurring: true,
      });
    });

    // Gastos fijos
    fixedExpensesData.forEach((exp) => {
      const day = exp.payment_day || 1;
      const date = new Date(new Date().getFullYear(), new Date().getMonth(), day);
      if (date >= monthStart && date <= monthEnd) {
        events.push({
          id: `fix-${exp.id}`,
          date: format(date, "yyyy-MM-dd"),
          type: "fixed",
          name: exp.name,
          amount: exp.amount,
          recurring: true,
        });
      }
    });

    // Deudas
    debtData.forEach((debt) => {
      events.push({
        id: `debt-${debt.id}`,
        date: format(new Date(new Date().getFullYear(), new Date().getMonth(), 15), "yyyy-MM-dd"),
        type: "debt",
        name: `${debt.name} (min)`,
        amount: debt.minimum_payment,
        recurring: true,
      });
    });

    return events;
  }, [incomeData, fixedExpensesData, debtData, monthStart, monthEnd]);

  const getEventsForDay = (date: Date) => {
    return calendarEvents.filter((e) => isSameDay(new Date(e.date), date));
  };

  const pieData = [
    { name: "Fixed", value: totalFixed, color: "#3b82f6" },
    { name: "Variable", value: totalVariable, color: "#10b981" },
    { name: "Debt", value: totalDebtPayment, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* HEADER */}
          <div className="no-print flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <Home className="h-12 w-12" />
                Family Budget Planner UK
              </h1>
              <p className="text-muted-foreground">Hi, {activeProfile.name}!</p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle language={language} onLanguageChange={(l: Language) => setLanguage(l)} />
              <ProfileSelector language={language} />
              <Button variant="outline" size="icon" onClick={() => window.print()}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => supabase.auth.signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* RESUMEN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
              </CardContent>
            </Card>

            <Card className={`${cashFlow >= 0 ? "border-emerald-200" : "border-orange-200"}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium ${cashFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                  Cash Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${cashFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                  {formatCurrency(cashFlow)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-600 flex items-center gap-1">
                  <PiggyBank className="h-4 w-4" /> Total Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{formatCurrency(savingsTotal)}</div>
              </CardContent>
            </Card>
          </div>

          {/* DEBT FREE */}
          {debtData.length > 0 && (
            <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <TrendingUp className="h-6 w-6" />
                  Debt Free Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold">{format(debtFreeDate, "d MMM yyyy")}</p>
                  <p className="text-lg text-muted-foreground">{monthsToDebtFree} months</p>
                </div>
                <Progress
                  value={
                    (1 - debtData.reduce((s, d) => s + d.balance, 0) / debtData.reduce((s, d) => s + d.balance, 0)) *
                    100
                  }
                  className="h-4 mt-3"
                />
              </CardContent>
            </Card>
          )}

          {/* GASTOS PASTEL */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-64 h-64 mx-auto">
                  <svg viewBox="0 0 32 32" className="w-full h-full">
                    {(() => {
                      const total = pieData.reduce((s, d) => s + d.value, 0);
                      let cum = 0;
                      return pieData.map((d, i) => {
                        const percent = (d.value / total) * 100;
                        const start = (cum / total) * 360;
                        cum += d.value;
                        const end = (cum / total) * 360;
                        const large = percent > 50 ? 1 : 0;
                        const sr = (start * Math.PI) / 180;
                        const er = (end * Math.PI) / 180;
                        const x1 = 16 + 16 * Math.cos(sr);
                        const y1 = 16 + 16 * Math.sin(sr);
                        const x2 = 16 + 16 * Math.cos(er);
                        const y2 = 16 + 16 * Math.sin(er);
                        return (
                          <path key={i} d={`M16,16 L${x1},${y1} A16,16 0 ${large},1 ${x2},${y2} Z`} fill={d.color} />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                    {formatCurrency(totalExpenses)}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                      <span>{formatCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CALENDARIO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="p-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 mt-2">
                {blankDays.map((_, i) => (
                  <div key={`blank-${i}`} className="h-16 border rounded" />
                ))}
                {monthDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`h-16 border rounded p-1 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isSameDay(day, new Date()) ? "bg-blue-50 dark:bg-blue-900" : ""}`}
                    >
                      <div className="font-medium">{format(day, "d")}</div>
                      {dayEvents.slice(0, 2).map((e, i) => (
                        <div
                          key={i}
                          className={`text-[9px] truncate ${e.type === "income" ? "text-green-600" : e.type === "debt" ? "text-red-600" : "text-blue-600"}`}
                        >
                          {e.name}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-muted-foreground">+{dayEvents.length - 2}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* TABS */}
          <Tabs defaultValue="overview" className="no-print">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="debts">Debts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Family Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-bold text-center text-blue-600">
                    {cashFlow > 0 ? "Healthy" : "Review"}
                  </div>
                  <Progress value={cashFlow > 0 ? 80 : 40} className="mt-4" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="income">
              <IncomeManager language={language} />
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Extra Income</CardTitle>
                </CardHeader>
                <CardContent>
                  {variableIncome.map((inc) => (
                    <div key={inc.id} className="flex justify-between p-2 border-b">
                      <span>
                        {inc.description}: {formatCurrency(inc.amount)}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => deleteIncome(inc.id)}>
                        Delete
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenses">
              <Tabs defaultValue="fixed" className="mt-6">
                <TabsList>
                  <TabsTrigger value="fixed">Fixed</TabsTrigger>
                  <TabsTrigger value="variable">Variable</TabsTrigger>
                </TabsList>
                <TabsContent value="fixed">
                  <FixedExpensesManager language={language} />
                </TabsContent>
                <TabsContent value="variable">
                  <VariableExpensesManager language={language} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="debts">
              <DebtsManager language={language} />
            </TabsContent>
          </Tabs>

          {/* DISCLAIMER */}
          <footer className="no-print py-8 text-center text-xs text-muted-foreground border-t mt-12">
            <p className="font-semibold mb-2">Legal Disclaimer (UK)</p>
            <p>This app is for educational use. Not financial advice. Consult an FCA adviser.</p>
            <p className="mt-2">© 2025 Family Budget Planner UK</p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Index;
