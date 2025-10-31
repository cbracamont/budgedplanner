// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import {
  TrendingUp,
  AlertCircle,
  Download,
  LogOut,
  Bot,
  X,
  Calendar,
  DollarSign,
  Zap,
  Send,
  Edit2,
  Trash2,
  Plus,
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
type Event = {
  id: string;
  date: string;
  type: "income" | "debt" | "fixed" | "variable";
  name: string;
  amount: number;
  recurring?: boolean;
};

const Index = () => {
  useTheme();
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: profiles = [] } = useFinancialProfiles();
  const activeProfile = profiles.find((p) => p.is_active) || { name: "User" };

  const { data: incomeData = [] } = useIncomeSources();
  const { data: debtData = [] } = useDebts();
  const { data: fixedExpensesData = [] } = useFixedExpenses();
  const { data: variableExpensesData = [] } = useVariableExpenses();
  const { data: savingsGoalsData = [] } = useSavingsGoals();
  const { data: savings } = useSavings();
  const { data: variableIncome = [], addIncome, deleteIncome } = useVariableIncome();

  const dataLoading = false; // Asumimos datos cargados

  // === DEUDA: FECHA LIBRE ===
  const { debtFreeDate, monthsLeft, totalDebt, monthlyPayment } = useMemo(() => {
    const total = debtData.reduce((s, d) => s + d.balance, 0);
    const minPay = debtData.reduce((s, d) => s + d.minimum_payment, 0);
    const extra = 200;
    const monthly = minPay + extra;

    let remaining = total;
    let months = 0;
    while (remaining > 0 && months < 120) {
      const interest = debtData.reduce((s, d) => s + d.balance * (d.apr / 100 / 12), 0);
      remaining = Math.max(0, remaining + interest - monthly);
      months++;
    }
    return {
      debtFreeDate: addMonths(new Date(), months),
      monthsLeft: months,
      totalDebt: total,
      monthlyPayment: monthly,
    };
  }, [debtData]);

  // === CALENDARIO EVENTOS ===
  const calendarEvents = useMemo(() => {
    const all: Event[] = [];

    incomeData.forEach((inc) => {
      all.push({
        id: `inc-${inc.id}`,
        date: format(new Date(), "yyyy-MM-01"),
        type: "income",
        name: inc.name,
        amount: inc.amount,
        recurring: true,
      });
    });

    fixedExpensesData.forEach((exp) => {
      const day = exp.payment_day || 1;
      all.push({
        id: `fix-${exp.id}`,
        date: format(new Date(new Date().getFullYear(), new Date().getMonth(), day), "yyyy-MM-dd"),
        type: "fixed",
        name: exp.name,
        amount: exp.amount,
        recurring: true,
      });
    });

    debtData.forEach((debt) => {
      all.push({
        id: `debt-${debt.id}`,
        date: format(new Date(), "yyyy-MM-15"),
        type: "debt",
        name: `${debt.name} (min)`,
        amount: debt.minimum_payment,
        recurring: true,
      });
    });

    all.push(...events);
    return all;
  }, [incomeData, fixedExpensesData, debtData, events]);

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDay = monthStart.getDay();
  const blankDays = Array(firstDay).fill(null);

  const getEventsForDay = (date: Date) => calendarEvents.filter((e) => isSameDay(new Date(e.date), date));

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

  const pieData = [
    { name: "Fixed", value: fixedExpensesData.reduce((s, e) => s + e.amount, 0), color: "#3b82f6" },
    { name: "Variable", value: variableExpensesData.reduce((s, e) => s + e.amount, 0), color: "#10b981" },
    { name: "Debt", value: debtData.reduce((s, d) => s + d.minimum_payment, 0), color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* HEADER */}
          <div className="no-print flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Debt Free UK
              </h1>
              <p className="text-muted-foreground">Hi, {activeProfile.name}!</p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle language={language} onLanguageChange={(l: Language) => setLanguage(l)} />
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

          {/* DEBT FREE COUNTDOWN */}
          <Card className="border-2 border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingUp className="h-6 w-6" />
                Debt Free Countdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold">{format(debtFreeDate, "d MMM yyyy")}</p>
                <p className="text-lg text-muted-foreground">{monthsLeft} months left</p>
              </div>
              <Progress value={(1 - debtData.reduce((s, d) => s + d.balance, 0) / totalDebt) * 100} className="h-4" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Total Debt</p>
                  <p className="text-2xl">{formatCurrency(totalDebt)}</p>
                </div>
                <div>
                  <p className="font-medium">Monthly Payment</p>
                  <p className="text-2xl text-green-600">{formatCurrency(monthlyPayment)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GRÁFICA PASTEL (única) */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expenses</CardTitle>
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
                    {formatCurrency(pieData.reduce((s, d) => s + d.value, 0))}
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
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <Button size="sm" onClick={() => setShowEventDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
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
                  <div key={`blank-${i}`} className="h-20 border rounded" />
                ))}
                {monthDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`h-20 border rounded p-1 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isSameDay(day, new Date()) ? "bg-blue-50 dark:bg-blue-900" : ""}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="font-medium">{format(day, "d")}</div>
                      {dayEvents.slice(0, 2).map((e, i) => (
                        <div
                          key={i}
                          className={`text-[10px] truncate ${e.type === "income" ? "text-green-600" : e.type === "debt" ? "text-red-600" : "text-blue-600"}`}
                        >
                          {e.name}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* TABS (sin Forecast) */}
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
                  <CardTitle>Financial Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-bold text-center text-green-600">
                    {(
                      85 -
                      (debtData.reduce((s, d) => s + d.minimum_payment, 0) /
                        incomeData.reduce((s, i) => s + i.amount, 1)) *
                        100 +
                      20
                    ).toFixed(0)}
                  </div>
                  <Progress value={85} className="mt-4" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Income, Expenses, Debts → sin cambios */}
          </Tabs>

          {/* AI + DISCLAIMER (sin cambios) */}
        </div>
      </div>
    </>
  );
};

export default Index;
