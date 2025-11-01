// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, add, sub } from "date-fns";
import {
  TrendingUp,
  Download,
  LogOut,
  Bot,
  Calendar,
  DollarSign,
  PiggyBank,
  Home,
  Edit2,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Zap,
  Snowflake,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Language = "en" | "es";
type DebtMethod = "avalanche" | "snowball" | "hybrid";

type Event = {
  id: string;
  date: string;
  type: "income" | "debt" | "fixed" | "variable";
  name: string;
  amount: number;
  recurring?: boolean;
};

const translations = {
  en: {
    avalanche: "Avalanche (High APR First)",
    snowball: "Snowball (Smallest First)",
    hybrid: "Hybrid (APR + Balance)",
    priority: "Priority",
    method: "Debt Payoff Method",
    recommended: "Recommended",
    months: "months",
    totalInterest: "Total Interest",
    strategy: "Strategy",
  },
  es: {
    avalanche: "Avalancha (APR Alto Primero)",
    snowball: "Bola de Nieve (Pequeño Primero)",
    hybrid: "Híbrido (APR + Saldo)",
    priority: "Prioridad",
    method: "Método de Pago",
    recommended: "Recomendado",
    months: "meses",
    totalInterest: "Interés Total",
    strategy: "Estrategia",
  },
};

const useVariableIncome = () => {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("variable_income");
    if (saved) setData(JSON.parse(saved));
  }, []);
  const addIncome = (amount: number, description: string) => {
    const newEntry = {
      id: Date.now().toString(),
      amount,
      description: description || "Extra",
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
  return { data, addIncome, deleteIncome };
};

const Index = () => {
  useTheme();
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [debtMethod, setDebtMethod] = useState<DebtMethod>("avalanche");

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: profiles = [] } = useFinancialProfiles();
  const activeProfile = profiles.find((p) => p.is_active) || { name: "Family" };

  const { data: incomeData = [] } = useIncomeSources();
  const { data: debtData = [] } = useDebts();
  const { data: fixedExpensesData = [] } = useFixedExpenses();
  const { data: variableExpensesData = [] } = useVariableExpenses();
  const { data: savingsGoalsData = [] } = useSavingsGoals();
  const { data: savings } = useSavings();
  const { data: variableIncome = [], addIncome, deleteIncome } = useVariableIncome();

  // === CÁLCULOS DE ESTRATEGIAS DE DEUDA ===
  const debtStrategies = useMemo(() => {
    if (debtData.length === 0) return null;

    const totalIncome = incomeData.reduce((s, i) => s + i.amount, 0) + variableIncome.reduce((s, i) => s + i.amount, 0);
    const totalFixed = fixedExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalVariable = variableExpensesData.reduce((s, e) => s + e.amount, 0);
    const minPayments = debtData.reduce((s, d) => s + d.minimum_payment, 0);
    const cashFlow = totalIncome - totalFixed - totalVariable - minPayments;
    const extra = Math.max(0, cashFlow);

    const calculateStrategy = (sortFn: (a: any, b: any) => number) => {
      const debts = [...debtData].sort(sortFn);
      let remaining = debts.map((d) => ({ ...d, balance: d.balance }));
      let months = 0;
      let totalInterest = 0;

      while (remaining.some((d) => d.balance > 0) && months < 240) {
        let paidThisMonth = 0;
        remaining.forEach((d, i) => {
          if (d.balance <= 0) return;
          const interest = d.balance * (d.apr / 100 / 12);
          totalInterest += interest;
          d.balance += interest;

          const payment = i === 0 ? d.minimum_payment + extra : d.minimum_payment;
          d.balance = Math.max(0, d.balance - payment);
          paidThisMonth += payment;
        });
        months++;
      }

      return { months, totalInterest: Math.round(totalInterest), payoffOrder: remaining.map((d) => d.name) };
    };

    const avalanche = calculateStrategy((a, b) => b.apr - a.apr);
    const snowball = calculateStrategy((a, b) => a.balance - b.balance);
    const hybrid = calculateStrategy((a, b) => {
      const scoreA = a.apr * 0.6 + (a.balance / 1000) * 0.4;
      const scoreB = b.apr * 0.6 + (b.balance / 1000) * 0.4;
      return scoreB - scoreA;
    });

    const best = [avalanche, snowball, hybrid].reduce((prev, curr) =>
      curr.totalInterest < prev.totalInterest ? curr : prev,
    );

    return { avalanche, snowball, hybrid, best, extra, minPayments };
  }, [debtData, incomeData, variableIncome, fixedExpensesData, variableExpensesData]);

  // === EVENTOS RECURRENTES EN TODOS LOS MESES ===
  const { calendarEvents, monthDays, blankDays } = useMemo(() => {
    const allEvents: Event[] = [];
    const startYear = currentMonth.getFullYear() - 1;
    const endYear = currentMonth.getFullYear() + 1;

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        incomeData.forEach((inc) => {
          const date = new Date(year, month, 1);
          allEvents.push({
            id: `inc-${inc.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "income",
            name: inc.name,
            amount: inc.amount,
            recurring: true,
          });
        });

        fixedExpensesData.forEach((exp) => {
          const day = exp.payment_day || 1;
          const lastDay = new Date(year, month + 1, 0).getDate();
          const date = new Date(year, month, Math.min(day, lastDay));
          allEvents.push({
            id: `fix-${exp.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "fixed",
            name: exp.name,
            amount: exp.amount,
            recurring: true,
          });
        });

        debtData.forEach((debt) => {
          const date = new Date(year, month, 15);
          allEvents.push({
            id: `debt-${debt.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "debt",
            name: `${debt.name} (min)`,
            amount: debt.minimum_payment,
            recurring: true,
          });
        });
      }
    }

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const blankDays = Array(monthStart.getDay()).fill(null);

    return { calendarEvents: allEvents, monthDays, blankDays };
  }, [currentMonth, incomeData, fixedExpensesData, debtData]);

  const t = translations[language];
  const formatCurrency = (n: number) => `£${n.toFixed(0)}`;

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

  const getEventsForDay = (date: Date) => calendarEvents.filter((e) => isSameDay(new Date(e.date), date));

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
              <LanguageToggle language={language} onLanguageChange={setLanguage} />
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

          {/* RESUMEN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* ... tarjetas de resumen ... */}
          </div>

          {/* ESTRATEGIAS DE DEUDA */}
          {debtStrategies && (
            <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    {t.strategy}
                  </span>
                  <Select value={debtMethod} onValueChange={(v) => setDebtMethod(v as DebtMethod)}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avalanche">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          {t.avalanche}
                        </div>
                      </SelectItem>
                      <SelectItem value="snowball">
                        <div className="flex items-center gap-2">
                          <Snowflake className="h-4 w-4" />
                          {t.snowball}
                        </div>
                      </SelectItem>
                      <SelectItem value="hybrid">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          {t.hybrid}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["avalanche", "snowball", "hybrid"].map((method) => {
                    const strat = debtStrategies[method as DebtMethod];
                    const isBest = debtStrategies.best === strat;
                    return (
                      <Card key={method} className={`${isBest ? "ring-2 ring-orange-500" : ""}`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            {method === "avalanche" && <Zap className="h-4 w-4 text-orange-600" />}
                            {method === "snowball" && <Snowflake className="h-4 w-4 text-blue-600" />}
                            {method === "hybrid" && <Zap className="h-4 w-4 text-purple-600" />}
                            {t[method as keyof typeof t]}
                            {isBest && <Badge variant="secondary">{t.recommended}</Badge>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Time:</span>
                              <span className="font-bold">
                                {strat.months} {t.months}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>{t.totalInterest}:</span>
                              <span className="font-bold text-red-600">{formatCurrency(strat.totalInterest)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              <strong>Order:</strong> {strat.payoffOrder.join(" → ")}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PRIORIDAD DE DEUDAS EN LISTA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Debt Priority ({t[debtMethod]})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debtData.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No debts</p>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const sorted = [...debtData];
                    if (debtMethod === "avalanche") sorted.sort((a, b) => b.apr - a.apr);
                    else if (debtMethod === "snowball") sorted.sort((a, b) => a.balance - b.balance);
                    else
                      sorted.sort(
                        (a, b) => b.apr * 0.6 + (b.balance / 1000) * 0.4 - (a.apr * 0.6 + (a.balance / 1000) * 0.4),
                      );

                    return sorted.map((debt, i) => (
                      <div
                        key={debt.id}
                        className={`p-4 rounded-lg border-l-4 ${i === 0 ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-orange-600">#{i + 1}</div>
                            <div>
                              <p className="font-semibold">{debt.name}</p>
                              <p className="text-sm text-muted-foreground">
                                APR {debt.apr}% • Balance {formatCurrency(debt.balance)}
                              </p>
                            </div>
                          </div>
                          <Badge variant={i === 0 ? "destructive" : "secondary"}>
                            {i === 0 ? "Pay First" : `Min: ${formatCurrency(debt.minimum_payment)}`}
                          </Badge>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CALENDARIO CON EVENTOS RECURRENTES */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCurrentMonth(sub(currentMonth, { months: 1 }))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCurrentMonth(add(currentMonth, { months: 1 }))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
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

          {/* TABS CON GESTORES */}
          <Tabs defaultValue="overview" className="no-print">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="debts">Debts</TabsTrigger>
            </TabsList>

            <TabsContent value="debts">
              <DebtsManager language={language} />
            </TabsContent>

            {/* ... resto de pestañas ... */}
          </Tabs>

          <footer className="no-print py-8 text-center text-xs text-muted-foreground border-t mt-12">
            <p className="font-semibold mb-2">Legal Disclaimer (UK)</p>
            <p>This app is for educational use only. Not financial advice. Consult an FCA adviser.</p>
            <p className="mt-2">© 2025 Family Budget Planner UK</p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Index;
