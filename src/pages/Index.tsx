// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Slider } from "@/components/ui/slider";
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

type Language = "en" | "es" | "pl";
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
    overview: "Overview",
    income: "Income",
    expenses: "Expenses",
    debts: "Debts",
    debtPlanner: "Debt Planner",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    cashFlow: "Cash Flow",
    totalSavings: "Total Savings",
    healthy: "Healthy",
    review: "Review",
    fixedIncome: "Fixed Income",
    variableIncome: "Variable Income",
    fixedExpenses: "Fixed Expenses",
    variableExpenses: "Variable Expenses",
    noData: "No data yet",
    add: "Add",
    description: "Description",
    strategy: "Debt Payoff Strategy",
    avalanche: "Avalanche (High APR First)",
    snowball: "Snowball (Smallest Balance First)",
    hybrid: "Hybrid (APR + Balance)",
    recommended: "Recommended",
    months: "months",
    totalInterest: "Total Interest Saved",
    priority: "Debt Priority Order",
    payFirst: "Pay First",
    minPayment: "Min Payment",
    monthlySavings: "Monthly Savings for Emergency Fund",
    emergencyFund: "Emergency Fund Estimate",
    cashFlowAfterSavings: "Cash Flow After Savings",
    debtPayment: "Available for Debt Payment",
    monthsToEmergency: "Months to Emergency Fund Goal"
  },
  es: {
    overview: "Resumen",
    income: "Ingresos",
    expenses: "Gastos",
    debts: "Deudas",
    debtPlanner: "Planificador de Deudas",
    totalIncome: "Ingresos Totales",
    totalExpenses: "Gastos Totales",
    cashFlow: "Flujo de Caja",
    totalSavings: "Ahorros Totales",
    healthy: "Saludable",
    review: "Revisar",
    fixedIncome: "Ingresos Fijos",
    variableIncome: "Ingresos Variables",
    fixedExpenses: "Gastos Fijos",
    variableExpenses: "Gastos Variables",
    noData: "No hay datos",
    add: "Añadir",
    description: "Descripción",
    strategy: "Estrategia de Pago de Deudas",
    avalanche: "Avalancha (APR Alto Primero)",
    snowball: "Bola de Nieve (Saldo Pequeño Primero)",
    hybrid: "Híbrido (APR + Saldo)",
    recommended: "Recomendado",
    months: "meses",
    totalInterest: "Interés Total Ahorrado",
    priority: "Orden de Prioridad de Deudas",
    payFirst: "Pagar Primero",
    minPayment: "Pago Mínimo",
    monthlySavings: "Ahorros Mensuales para Fondo de Emergencia",
    emergencyFund: "Estimación de Fondo de Emergencia",
    cashFlowAfterSavings: "Flujo de Caja Después de Ahorros",
    debtPayment: "Disponible para Pago de Deuda",
    monthsToEmergency: "Meses para Meta de Fondo de Emergencia"
  },
  pl: {
    overview: "Przegląd",
    income: "Dochody",
    expenses: "Wydatki",
    debts: "Długi",
    debtPlanner: "Plan Spłaty Długów",
    totalIncome: "Całkowity Dochód",
    totalExpenses: "Całkowite Wydatki",
    cashFlow: "Przepływ Gotówki",
    totalSavings: "Całkowite Oszczędności",
    healthy: "Zdrowy",
    review: "Przejrzyj",
    fixedIncome: "Stałe Dochody",
    variableIncome: "Zmienne Dochody",
    fixedExpenses: "Stałe Wydatki",
    variableExpenses: "Zmienne Wydatki",
    noData: "Brak danych",
    add: "Dodaj",
    description: "Opis",
    strategy: "Strategia Spłaty Długów",
    avalanche: "Lawina (Najwyższe Oprocentowanie Najpierw)",
    snowball: "Kula Śnieżna (Najmniejszy Saldo Najpierw)",
    hybrid: "Hybrydowa (Oprocentowanie + Saldo)",
    recommended: "Zalecane",
    months: "miesiące",
    totalInterest: "Całkowite Oszczędności Oprocentowania",
    priority: "Kolejność Priorytetu Długów",
    payFirst: "Spłać Najpierw",
    minPayment: "Minimalna Płatność",
    monthlySavings: "Miesięczne Oszczędności na Fundusz Awaryjny",
    emergencyFund: "Szacowany Fundusz Awaryjny",
    cashFlowAfterSavings: "Przepływ Gotówki Po Oszczędnościach",
    debtPayment: "Dostępne na Płatność Długu",
    monthsToEmergency: "Miesiące do Celu Funduszu Awaryjnego"
  }
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
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // MODAL PARA VARIABLE INCOME
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [newIncome, setNewIncome] = useState({
    description: "",
    amount: 0,
  });

  // SLIDER PARA AHORROS MENSUALES
  const [monthlySavings, setMonthlySavings] = useState(0);

  const [newEvent, setNewEvent] = useState<{
    name: string;
    amount: number;
    type: "income" | "debt" | "fixed" | "variable";
  }>({ name: "", amount: 0, type: "income" });

  const { data: profiles = [] } = useFinancialProfiles();
  const activeProfile = profiles.find((p) => p.is_active) || { name: "Family" };

  const { data: incomeData = [] } = useIncomeSources();
  const { data: debtData = [] } = useDebts();
  const { data: fixedExpensesData = [] } = useFixedExpenses();
  const { data: variableExpensesData = [] } = useVariableExpenses();
  const { data: savingsGoalsData = [] } = useSavingsGoals();
  const { data: savings } = useSavings();
  const { data: variableIncome = [], addIncome, deleteIncome } = useVariableIncome();

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  const t = translations[language];

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
    pieData,
    calendarEvents,
    monthStart,
    monthEnd,
    monthDays,
    firstDayOfWeek,
    blankDays,
  } = useMemo(() => {
    const totalIncome = incomeData.reduce((s, i) => s + i.amount, 0) + variableIncome.reduce((s, i) => s + i.amount, 0);
    const totalFixed = fixedExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalVariable = variableExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalDebtPayment = debtData.reduce((s, d) => s + d.minimum_payment, 0);
    const totalExpenses = totalFixed + totalVariable + totalDebtPayment;
    const cashFlow = totalIncome - totalExpenses;
    const savingsTotal = (savings?.emergency_fund || 0) + savingsGoalsData.reduce((s, g) => s + (g.current_amount || 0), 0);

    let remaining = debtData.reduce((s, d) => s + d.balance, 0);
    let months = 0;
    const extra = Math.max(0, (cashFlow - monthlySavings) * 0.3);
    const monthlyPay = totalDebtPayment + extra;
    while (remaining > 0 && months < 120) {
      const interest = debtData.reduce((s, d) => s + d.balance * (d.apr / 100 / 12), 0);
      remaining = Math.max(0, remaining + interest - monthlyPay);
      months++;
    }
    const debtFreeDate = addMonths(new Date(), months);

    const pieData = [
      { name: "Fixed", value: totalFixed, color: "#3b82f6" },
      { name: "Variable", value: totalVariable, color: "#10b981" },
      { name: "Debt", value: totalDebtPayment, color: "#ef4444" },
    ].filter((d) => d.value > 0);

    // === CALENDARIO CON EVENTOS RECURRENTES EN MÚLTIPLES MESES ===
    const allEvents: Event[] = [];
    const startYear = currentMonth.getFullYear() - 1;
    const endYear = currentMonth.getFullYear() + 1;

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const currentDate = new Date(year, month, 1);
        if (currentDate > new Date(endYear, 11, 31)) break;

        // INGRESOS FIJOS - Día 1 de cada mes
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

        // GASTOS FIJOS - Día de pago
        fixedExpensesData.forEach((exp) => {
          const day = exp.payment_day || 1;
          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
          const date = new Date(year, month, Math.min(day, lastDayOfMonth));
          allEvents.push({
            id: `fix-${exp.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "fixed",
            name: exp.name,
            amount: exp.amount,
            recurring: true,
          });
        });

        // DEUDAS - Día 15
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

        // GASTOS VARIABLES - Día 10 (recurrente)
        variableExpensesData.forEach((exp) => {
          const date = new Date(year, month, 10);
          allEvents.push({
            id: `var-${exp.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "variable",
            name: exp.name,
            amount: exp.amount,
            recurring: true,
          });
        });
      }
    }

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = monthStart.getDay();
    const blankDays = Array(firstDayOfWeek).fill(null);

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
      pieData,
      calendarEvents: allEvents,
      monthStart,
      monthEnd,
      monthDays,
      firstDayOfWeek,
      blankDays,
    };
  }, [
    incomeData,
    variableIncome,
    fixedExpensesData,
    variableExpensesData,
    debtData,
    savings,
    savingsGoalsData,
    currentMonth,
    monthlySavings,
  ]);

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

  const getEventsForDay = (date: Date) => calendarEvents.filter((e) => isSameDay(new Date(e.date), date));

  const addEvent = () => {
    if (selectedDate && newEvent.name && newEvent.amount) {
      const newEntry: Event = {
        id: Date.now().toString(),
        date: format(selectedDate, "yyyy-MM-dd"),
        type: newEvent.type,
        name: newEvent.name,
        amount: newEvent.amount,
      };
      setEvents([...events, newEntry]);
      setShowEventDialog(false);
      setNewEvent({ name: "", amount: 0, type: "income" });
    }
  };

  const updateEvent = () => {
    if (editingEvent && newEvent.name && newEvent.amount) {
      const updated = events.map((e) =>
        e.id === editingEvent.id ? { ...e, name: newEvent.name, amount: newEvent.amount } : e,
      );
      setEvents(updated);
      setEditingEvent(null);
      setShowEventDialog(false);
      setNewEvent({ name: "", amount: 0, type: "income" });
    }
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
    setDeleteId(null);
  };

  const sendToAI = () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiResponse("");

    setTimeout(() => {
      const lower = aiInput.toLowerCase();
      let response = "";

      if (lower.includes("save") || lower.includes("ahorrar") || lower.includes("cut")) {
        response = `To save more:\n1. Review variable expenses (£${totalVariable}) — cut £50-100 on food/entertainment.\n2. Put 50% of any extra income into savings.\n3. Set a "no-spend" weekend each month.`;
      } else if (lower.includes("debt") || lower.includes("deuda") || lower.includes("pay off")) {
        response = `Debt strategy:\n• Pay minimums on all debts.\n• Use 30% of surplus (£${Math.round(cashFlow * 0.3)}) to attack highest APR first.\n• You'll be debt-free in ${monthsToDebtFree} months.`;
      } else if (lower.includes("emergency") || lower.includes("fondo")) {
        response = `Emergency fund goal: 3-6 months of expenses (£${totalExpenses * 3}-£${totalExpenses * 6}).\nYou have £${savingsTotal}. Keep building!`;
      } else if (lower.includes("budget") || lower.includes("presupuesto")) {
        response = `Your budget:\n• Income: ${formatCurrency(totalIncome)}\n• Expenses: ${formatCurrency(totalExpenses)}\n• Cash Flow: ${formatCurrency(cashFlow)}\n${cashFlow > 0 ? "You're saving!" : "Reduce spending by £" + -cashFlow}`;
      } else {
        response = `I see you're asking about "${aiInput}".\n\nQuick tip: Track every expense for 30 days. Most families find £100-200 in hidden waste.\nWant help with a specific category?`;
      }

      setAiResponse(response);
      setAiLoading(false);
    }, 800);
  };

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-900">
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
              <LanguageToggle language={language} onLanguageChange={handleLanguageChange} />
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
                  <p className="text-lg text-muted-foreground">{monthsToDebtFree} months away</p>
                </div>
                <Progress value={80} className="h-4 mt-3" />
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
                  <Button size="sm" onClick={() => setShowEventDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add
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
                      className={`h-16 border rounded p-1 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                        isSameDay(day, new Date()) ? "bg-blue-50 dark:bg-blue-900" : ""
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="font-medium">{format(day, "d")}</div>
                      {dayEvents.slice(0, 2).map((e, i) => (
                        <div
                          key={i}
                          className={`text-[9px] truncate ${
                            e.type === "income"
                              ? "text-green-600"
                              : e.type === "debt"
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
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

          {/* AI MODAL */}
          <AlertDialog open={showAI} onOpenChange={setShowAI}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" /> Budget Assistant
                </AlertDialogTitle>
              </AlertDialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Ask anything: 'How can I save £200/month?' or 'Should I pay off debt first?'"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="min-h-24"
                />
                <Button onClick={sendToAI} disabled={aiLoading} className="w-full">
                  {aiLoading ? (
                    "Thinking..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" /> Send
                    </>
                  )}
                </Button>
                {aiResponse && (
                  <Card>
                    <CardContent className="pt-4 whitespace-pre-wrap text-sm">{aiResponse}</CardContent>
                  </Card>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* DETALLE DEL DÍA */}
          {selectedDate && (
            <AlertDialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{format(selectedDate, "PPP")}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription className="space-y-3">
                  {getEventsForDay(selectedDate).length === 0 ? (
                    <p className="text-center py-4">No events</p>
                  ) : (
                    getEventsForDay(selectedDate).map((e) => (
                      <div key={e.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{e.name}</p>
                          <p className="text-xs text-muted-foreground">{e.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={e.type === "income" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {formatCurrency(e.amount)}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingEvent(e);
                                setNewEvent({
                                  name: e.name,
                                  amount: e.amount,
                                  type: e.type,
                                });
                                setShowEventDialog(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteId(e.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* AGREGAR/EDITAR EVENTO */}
          <AlertDialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{editingEvent ? "Edit Event" : "Add Event"}</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={newEvent.amount || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(v: Event["type"]) => setNewEvent({ ...newEvent, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="fixed">Fixed Expense</SelectItem>
                      <SelectItem value="variable">Variable Expense</SelectItem>
                      <SelectItem value="debt">Debt Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={editingEvent ? updateEvent : addEvent}>
                  {editingEvent ? "Save" : "Add"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* CONFIRMAR ELIMINAR */}
          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogFooter>
                <AlertDialogAction onClick={() => deleteEvent(deleteId!)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* MODAL PARA VARIABLE INCOME */}
          <AlertDialog open={showIncomeModal} onOpenChange={setShowIncomeModal}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Add Variable Income</AlertDialogTitle>
                <AlertDialogDescription>Extra income like bonuses, gifts, side hustles</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newIncome.description}
                    onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                    placeholder="e.g. Freelance work, Bonus, Gift"
                  />
                </div>
                <div>
                  <Label>Amount (£)</Label>
                  <Input
                    type="number"
                    value={newIncome.amount || ""}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  if (newIncome.description && newIncome.amount > 0) {
                    addIncome(newIncome.amount, newIncome.description);
                    setNewIncome({ description: "", amount: 0 });
                    setShowIncomeModal(false);
                  }
                }}>
                  Add Income
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
              <Tabs defaultValue="fixed" className="mt-6">
                <TabsList>
                  <TabsTrigger value="fixed">Fixed Income</TabsTrigger>
                  <TabsTrigger value="variable">Variable Income</TabsTrigger>
                </TabsList>

                <TabsContent value="fixed">
                  <IncomeManager language={language} />
                </TabsContent>

                <TabsContent value="variable">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center justify-between">
                        Variable Income
                        <Button size="sm" onClick={() => setShowIncomeModal(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </CardTitle>
                      <CardDescription>Extra income like bonuses, gifts, side hustles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {variableIncome.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6">No variable income yet</p>
                      ) : (
                        <div className="space-y-2">
                          {variableIncome.map((inc) => (
                            <div key={inc.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-medium">{inc.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(inc.date), "d MMM yyyy")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-green-600">{formatCurrency(inc.amount)}</span>
                                <Button size="sm" variant="ghost" onClick={() => deleteIncome(inc.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
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