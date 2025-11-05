"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, add, sub } from "date-fns";
import { formatCurrency } from "@/lib/i18n";
import { TrendingUp, Download, LogOut, Bot, Calendar, DollarSign, PiggyBank, Home, Edit2, Trash2, Plus, ChevronLeft, ChevronRight, Send, X, Zap, Snowflake, Moon, Sun, PoundSterling } from "lucide-react";
import { useIncomeSources, useDebts, useFixedExpenses, useVariableExpenses, useSavingsGoals, useSavings } from "@/hooks/useFinancialData";
import { useFinancialProfiles } from "@/hooks/useFinancialProfiles";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
import { SavingsManager } from "@/components/SavingsManager";
import { SavingsGoalsManager } from "@/components/SavingsGoalsManager";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { useTheme as useNextTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
    monthsToEmergency: "Months to Emergency Fund Goal",
    monthlyDebtAllocation: "Monthly Debt Allocation"
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
    monthsToEmergency: "Meses para Meta de Fondo de Emergencia",
    monthlyDebtAllocation: "Asignación Mensual de Deuda"
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
    monthsToEmergency: "Miesiące do Celu Funduszu Awaryjnego",
    monthlyDebtAllocation: "Miesięczna Alokacja Długu"
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
      date: new Date().toISOString()
    };
    const updated = [newEntry, ...data];
    setData(updated);
    localStorage.setItem("variable_income", JSON.stringify(updated));
  };
  const deleteIncome = (id: string) => {
    const updated = data.filter(i => i.id !== id);
    setData(updated);
    localStorage.setItem("variable_income", JSON.stringify(updated));
  };
  return {
    data,
    loading,
    addIncome,
    deleteIncome
  };
};
const Index = () => {
  useTheme();
  const {
    theme,
    setTheme
  } = useNextTheme();
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
    amount: 0
  });

  // SLIDER PARA AHORROS MENSUALES
  const [monthlySavings, setMonthlySavings] = useState(0);

  // ESTRATEGIA DE DEUDA
  const [debtMethod, setDebtMethod] = useState<DebtMethod>("avalanche");
  const [newEvent, setNewEvent] = useState<{
    name: string;
    amount: number;
    type: "income" | "debt" | "fixed" | "variable";
  }>({
    name: "",
    amount: 0,
    type: "income"
  });
  const {
    data: profiles = []
  } = useFinancialProfiles();
  const activeProfile = profiles.find(p => p.is_active) || {
    name: "Family"
  };
  const {
    data: incomeData = []
  } = useIncomeSources();
  const {
    data: debtData = []
  } = useDebts();
  const {
    data: fixedExpensesData = []
  } = useFixedExpenses();
  const {
    data: variableExpensesData = []
  } = useVariableExpenses();
  const {
    data: savingsGoalsData = []
  } = useSavingsGoals();
  const {
    data: savings
  } = useSavings();
  const {
    data: variableIncome = [],
    addIncome,
    deleteIncome
  } = useVariableIncome();
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
    availableToSave,
    debtFreeDate,
    monthsToDebtFree,
    pieData,
    calendarEvents,
    monthStart,
    monthEnd,
    monthDays,
    firstDayOfWeek,
    blankDays
  } = useMemo(() => {
    const totalIncome = incomeData.reduce((s, i) => s + i.amount, 0) + variableIncome.reduce((s, i) => s + i.amount, 0);
    const totalFixed = fixedExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalVariable = variableExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalDebtPayment = debtData.reduce((s, d) => s + d.minimum_payment, 0);
    const monthlySavingsGoal = savings?.monthly_goal || 0;
    const totalExpenses = totalFixed + totalVariable + totalDebtPayment;
    const cashFlow = totalIncome - totalExpenses;
    const availableToSave = cashFlow - monthlySavingsGoal;
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
    const pieData = [{
      name: "Fixed",
      value: totalFixed,
      color: "#3b82f6"
    }, {
      name: "Variable",
      value: totalVariable,
      color: "#10b981"
    }, {
      name: "Debt",
      value: totalDebtPayment,
      color: "#ef4444"
    }].filter(d => d.value > 0);

    // === CALENDARIO CON EVENTOS RECURRENTES EN MÚLTIPLES MESES ===
    const allEvents: Event[] = [];
    const startYear = currentMonth.getFullYear() - 1;
    const endYear = currentMonth.getFullYear() + 1;
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const currentDate = new Date(year, month, 1);
        if (currentDate > new Date(endYear, 11, 31)) break;

        // INGRESOS FIJOS - Día 1 de cada mes
        incomeData.forEach(inc => {
          const date = new Date(year, month, 1);
          allEvents.push({
            id: `inc-${inc.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "income",
            name: inc.name,
            amount: inc.amount,
            recurring: true
          });
        });

        // GASTOS FIJOS - Día de pago
        fixedExpensesData.forEach(exp => {
          const day = exp.payment_day || 1;
          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
          const date = new Date(year, month, Math.min(day, lastDayOfMonth));
          allEvents.push({
            id: `fix-${exp.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "fixed",
            name: exp.name,
            amount: exp.amount,
            recurring: true
          });
        });

        // DEUDAS - Día 15
        debtData.forEach(debt => {
          const date = new Date(year, month, 15);
          allEvents.push({
            id: `debt-${debt.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "debt",
            name: `${debt.name} (min)`,
            amount: debt.minimum_payment,
            recurring: true
          });
        });

        // GASTOS VARIABLES - Día 10 (recurrente)
        variableExpensesData.forEach(exp => {
          const date = new Date(year, month, 10);
          allEvents.push({
            id: `var-${exp.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "variable",
            name: exp.name,
            amount: exp.amount,
            recurring: true
          });
        });
      }
    }
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({
      start: monthStart,
      end: monthEnd
    });
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
      availableToSave,
      debtFreeDate,
      monthsToDebtFree: months,
      pieData,
      calendarEvents: allEvents,
      monthStart,
      monthEnd,
      monthDays,
      firstDayOfWeek,
      blankDays
    };
  }, [incomeData, variableIncome, fixedExpensesData, variableExpensesData, debtData, savings, savingsGoalsData, currentMonth, monthlySavings]);
  const formatCurrency = (amount: number) => `£${amount.toFixed(0)}`;
  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (authLoading) return <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>;
  if (!user) return <Auth />;
  const getEventsForDay = (date: Date) => calendarEvents.filter(e => isSameDay(new Date(e.date), date));
  const addEvent = () => {
    if (selectedDate && newEvent.name && newEvent.amount) {
      const newEntry: Event = {
        id: Date.now().toString(),
        date: format(selectedDate, "yyyy-MM-dd"),
        type: newEvent.type,
        name: newEvent.name,
        amount: newEvent.amount
      };
      setEvents([...events, newEntry]);
      setShowEventDialog(false);
      setNewEvent({
        name: "",
        amount: 0,
        type: "income"
      });
    }
  };
  const updateEvent = () => {
    if (editingEvent && newEvent.name && newEvent.amount) {
      const updated = events.map(e => e.id === editingEvent.id ? {
        ...e,
        name: newEvent.name,
        amount: newEvent.amount
      } : e);
      setEvents(updated);
      setEditingEvent(null);
      setShowEventDialog(false);
      setNewEvent({
        name: "",
        amount: 0,
        type: "income"
      });
    }
  };
  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    setDeleteId(null);
  };
  const sendToAI = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("financial-advisor", {
        body: {
          messages: [{
            role: "user",
            content: aiInput
          }]
        }
      });
      if (error) {
        console.error("Error calling financial advisor:", error);
        setAiResponse("Lo siento, hubo un error al conectar con el asistente financiero. Por favor, intenta de nuevo.");
        setAiLoading(false);
        return;
      }
      if (data.error) {
        setAiResponse(data.error);
      } else {
        const assistantMessage = data.choices?.[0]?.message?.content || "No se recibió respuesta del asistente.";
        setAiResponse(assistantMessage);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setAiResponse("Ocurrió un error inesperado. Por favor, intenta de nuevo.");
    } finally {
      setAiLoading(false);
    }
  };
  return <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-900">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* HEADER */}
          <div className="no-print flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3 text-center">
                <Home className="h-12 w-12" />
                Family Budget Planner UK
              </h1>
              <p className="text-muted-foreground">Hi, {activeProfile.name}!</p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle language={language} onLanguageChange={handleLanguageChange} />
              <ProfileSelector language={language} />
              <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
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

          {/* RESUMEN - Enhanced Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-green-200 hover-scale transition-all duration-300 hover:shadow-lg animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 animate-scale-in">{formatCurrency(totalIncome)}</div>
                <Progress value={100} className="mt-3 h-2 bg-green-100" />
                <p className="text-xs text-muted-foreground mt-2">Monthly total</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 hover-scale transition-all duration-300 hover:shadow-lg animate-fade-in" style={{
            animationDelay: "0.1s"
          }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                  <PoundSterling className="h-4 w-4" />
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 animate-scale-in">{formatCurrency(totalExpenses)}</div>
                <Progress value={totalExpenses / totalIncome * 100} className="mt-3 h-2 bg-red-100" />
                <p className="text-xs text-muted-foreground mt-2">
                  {totalIncome > 0 ? `${(totalExpenses / totalIncome * 100).toFixed(1)}% of income` : "0% of income"}
                </p>
              </CardContent>
            </Card>

            <Card className={`${cashFlow >= 0 ? "border-emerald-200" : "border-orange-200"} hover-scale transition-all duration-300 hover:shadow-lg animate-fade-in`} style={{
            animationDelay: "0.2s"
          }}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium ${cashFlow >= 0 ? "text-emerald-600" : "text-orange-600"} flex items-center gap-2`}>
                  {cashFlow >= 0 ? <TrendingUp className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                  Cash Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${cashFlow >= 0 ? "text-emerald-600" : "text-orange-600"} animate-scale-in`}>
                  {formatCurrency(cashFlow)}
                </div>
                <Progress value={cashFlow >= 0 ? 100 : 40} className={`mt-3 h-2 ${cashFlow >= 0 ? "bg-emerald-100" : "bg-orange-100"}`} />
                <p className="text-xs text-muted-foreground mt-2">
                  {cashFlow >= 0 ? "Positive flow 💰" : "Needs attention ⚠️"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover-scale transition-all duration-300 hover:shadow-lg animate-fade-in" style={{
            animationDelay: "0.3s"
          }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-600 flex items-center gap-2">
                  <PiggyBank className="h-4 w-4" />
                  Total Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 animate-scale-in">
                  {formatCurrency(savingsTotal)}
                </div>
                <Progress value={savingsTotal > 0 ? Math.min(savingsTotal / (totalIncome * 3) * 100, 100) : 0} className="mt-3 h-2 bg-purple-100" />
                <p className="text-xs text-muted-foreground mt-2">
                  {savingsTotal > 0 ? "Great progress! 🎯" : "Start saving today"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* DEBT FREE */}
          {debtData.length > 0 && <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <TrendingUp className="h-6 w-6" />
                  Debt Free Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="font-bold text-6xl">{format(debtFreeDate, "d MMM yyyy")}</p>
                  <p className="text-lg text-muted-foreground">{monthsToDebtFree} months away</p>
                </div>
                <Progress value={80} className="h-4 mt-3" />
              </CardContent>
            </Card>}

          {/* GASTOS PASTEL */}
          {pieData.length > 0 && <Card>
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
                    const percent = d.value / total * 100;
                    const start = cum / total * 360;
                    cum += d.value;
                    const end = cum / total * 360;
                    const large = percent > 50 ? 1 : 0;
                    const sr = start * Math.PI / 180;
                    const er = end * Math.PI / 180;
                    const x1 = 16 + 16 * Math.cos(sr);
                    const y1 = 16 + 16 * Math.sin(sr);
                    const x2 = 16 + 16 * Math.cos(er);
                    const y2 = 16 + 16 * Math.sin(er);
                    return <path key={i} d={`M16,16 L${x1},${y1} A16,16 0 ${large},1 ${x2},${y2} Z`} fill={d.color} />;
                  });
                })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                    {formatCurrency(totalExpenses)}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {pieData.map((d, i) => <div key={i} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{
                    backgroundColor: d.color
                  }} />
                        {d.name}
                      </span>
                      <span>{formatCurrency(d.value)}</span>
                    </div>)}
                </div>
              </CardContent>
            </Card>}

          {/* CALENDARIO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCurrentMonth(sub(currentMonth, {
                  months: 1
                }))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCurrentMonth(add(currentMonth, {
                  months: 1
                }))}>
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
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="p-2">
                    {d}
                  </div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 mt-2">
                {blankDays.map((_, i) => <div key={`blank-${i}`} className="h-16 border rounded" />)}
                {monthDays.map(day => {
                const dayEvents = getEventsForDay(day);
                return <div key={day.toISOString()} className={`h-16 border rounded p-1 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isSameDay(day, new Date()) ? "bg-blue-50 dark:bg-blue-900" : ""}`} onClick={() => setSelectedDate(day)}>
                      <div className="font-medium">{format(day, "d")}</div>
                      {dayEvents.slice(0, 2).map((e, i) => <div key={i} className={`text-[9px] truncate ${e.type === "income" ? "text-green-600" : e.type === "debt" ? "text-red-600" : "text-blue-600"}`}>
                          {e.name}
                        </div>)}
                      {dayEvents.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayEvents.length - 2}</div>}
                    </div>;
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
                <Textarea placeholder="Ask anything: 'How can I save £200/month?' or 'Should I pay off debt first?'" value={aiInput} onChange={e => setAiInput(e.target.value)} className="min-h-24" />
                <Button onClick={sendToAI} disabled={aiLoading} className="w-full">
                  {aiLoading ? "Thinking..." : <>
                      <Send className="h-4 w-4 mr-2" /> Send
                    </>}
                </Button>
                {aiResponse && <Card>
                    <CardContent className="pt-4 space-y-4 whitespace-pre-wrap text-sm">{aiResponse}</CardContent>
                  </Card>}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* DETALLE DEL DÍA */}
          {selectedDate && <AlertDialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{format(selectedDate, "PPP")}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription className="space-y-3">
                  {getEventsForDay(selectedDate).length === 0 ? <p className="text-center py-4">No events</p> : getEventsForDay(selectedDate).map(e => <div key={e.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{e.name}</p>
                          <p className="text-xs text-muted-foreground">{e.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={e.type === "income" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {formatCurrency(e.amount)}
                          </span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => {
                      setEditingEvent(e);
                      setNewEvent({
                        name: e.name,
                        amount: e.amount,
                        type: e.type
                      });
                      setShowEventDialog(true);
                    }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteId(e.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>)}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>}

          {/* AGREGAR/EDITAR EVENTO */}
          <AlertDialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{editingEvent ? "Edit Event" : "Add Event"}</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={newEvent.name} onChange={e => setNewEvent({
                  ...newEvent,
                  name: e.target.value
                })} />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input type="number" value={newEvent.amount || ""} onChange={e => setNewEvent({
                  ...newEvent,
                  amount: parseFloat(e.target.value) || 0
                })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newEvent.type} onValueChange={(v: Event["type"]) => setNewEvent({
                  ...newEvent,
                  type: v
                })}>
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
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteEvent(deleteId!)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* MODAL PARA VARIABLE INCOME */}
          <AlertDialog open={showIncomeModal} onOpenChange={setShowIncomeModal}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Add Variable Income</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Input value={newIncome.description} onChange={e => setNewIncome({
                  ...newIncome,
                  description: e.target.value
                })} placeholder="e.g. Freelance work, Bonus, Gift" />
                </div>
                <div>
                  <Label>Amount (£)</Label>
                  <Input type="number" value={newIncome.amount || ""} onChange={e => setNewIncome({
                  ...newIncome,
                  amount: parseFloat(e.target.value) || 0
                })} placeholder="0" />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                if (newIncome.description && newIncome.amount > 0) {
                  addIncome(newIncome.amount, newIncome.description);
                  setNewIncome({
                    description: "",
                    amount: 0
                  });
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
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="debts">Debts</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Enhanced Budget Health Card with Interactive Visualization */}
              <Card className="border-2 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Budget Health Dashboard
                  </CardTitle>
                  <CardDescription>Your financial overview at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Status - Multi-Stage */}
                  <div className="text-center py-8">
                    {/* Determine status based on cashFlow relative to totalExpenses */}
                    {(() => {
                    const status = (() => {
                      if (cashFlow > totalExpenses * 0.3) return {
                        emoji: "🚀",
                        label: "Excellent",
                        color: "text-emerald-600",
                        progress: 95,
                        message: `Amazing! You're saving ${formatCurrency(cashFlow)} per month — 30%+ of expenses. Keep going!`
                      };
                      if (cashFlow > totalExpenses * 0.1) return {
                        emoji: "💪",
                        label: "Strong",
                        color: "text-green-600",
                        progress: 80,
                        message: `Great job! You're saving ${formatCurrency(cashFlow)} per month — 10-30% of expenses. Solid foundation.`
                      };
                      if (cashFlow > 0) return {
                        emoji: "✅",
                        label: "Healthy",
                        color: "text-blue-600",
                        progress: 65,
                        message: `You're in the green! Saving ${formatCurrency(cashFlow)} per month. Small wins add up.`
                      };
                      if (cashFlow > -totalExpenses * 0.1) return {
                        emoji: "⚠️",
                        label: "Review",
                        color: "text-orange-600",
                        progress: 40,
                        message: `Close call! You're overspending by ${formatCurrency(Math.abs(cashFlow))} — less than 10% of expenses. Trim a little.`
                      };
                      return {
                        emoji: "🔴",
                        label: "Critical",
                        color: "text-red-600",
                        progress: 20,
                        message: `Alert! Overspending by ${formatCurrency(Math.abs(cashFlow))} — over 10% of expenses. Cut now to avoid debt.`
                      };
                    })();
                    return <div>
                          <div className={`text-7xl font-bold ${status.color} animate-scale-in`}>
                            {status.emoji} {status.label}
                          </div>
                          <Progress value={status.progress} className="mt-6 h-3" />
                          <p className="mt-4 text-muted-foreground">{status.message}</p>
                        </div>;
                  })()}
                  </div>
                  {/* Main Status */}
                  

                  {/* Cash Flow Breakdown */}
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
                      {variableIncome.length === 0 ? <p className="text-center text-muted-foreground py-6">No variable income yet</p> : <div className="space-y-2">
                          {variableIncome.map(inc => <div key={inc.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
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
                            </div>)}
                        </div>}
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
              <DebtPlanner language={language} />
            </TabsContent>

            <TabsContent value="savings" className="space-y-6">
              <SavingsManager language={language} availableToSave={availableToSave} />
              <SavingsGoalsManager language={language} availableForSavings={availableToSave} availableBudget={availableToSave} />
            </TabsContent>
          </Tabs>

          <footer className="no-print py-8 text-center text-xs text-muted-foreground border-t mt-12">
            <p className="font-semibold mb-2">Legal Disclaimer (UK)</p>
            <p>This app is for educational use only. Not financial advice. Consult an FCA adviser.</p>
            <p className="mt-2">© 2025 Family Budget Planner UK</p>
          </footer>
        </div>
      </div>
    </>;
};

// COMPONENTE DEBT PLANNER
const DebtPlanner = ({
  language
}: {
  language: Language;
}) => {
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [debtMethod, setDebtMethod] = useState<DebtMethod>("avalanche");
  const {
    data: incomeData = []
  } = useIncomeSources();
  const {
    data: debtData = []
  } = useDebts();
  const {
    data: fixedExpensesData = []
  } = useFixedExpenses();
  const {
    data: variableExpensesData = []
  } = useVariableExpenses();
  const {
    data: savings
  } = useSavings();
  const t = translations[language];
  const {
    totalIncome,
    totalFixed,
    totalVariable,
    totalDebtPayment,
    totalExpenses,
    cashFlow,
    savingsTotal,
    availableToSave
  } = useMemo(() => {
    const totalIncome = incomeData.reduce((s, i) => s + i.amount, 0);
    const totalFixed = fixedExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalVariable = variableExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalDebtPayment = debtData.reduce((s, d) => s + d.minimum_payment, 0);
    const monthlySavingsGoal = savings?.monthly_goal || 0;
    const totalExpenses = totalFixed + totalVariable + totalDebtPayment;
    const cashFlow = totalIncome - totalExpenses;
    const availableToSave = cashFlow - monthlySavingsGoal;
    const savingsTotal = savings?.emergency_fund || 0;
    return {
      totalIncome,
      totalFixed,
      totalVariable,
      totalDebtPayment,
      totalExpenses,
      cashFlow,
      savingsTotal,
      availableToSave
    };
  }, [incomeData, debtData, fixedExpensesData, variableExpensesData, savings]);

  // CALCULAR ESTRATEGIA DE DEUDA
  const debtStrategy = useMemo(() => {
    if (debtData.length === 0) return null;
    const extraForDebt = Math.max(0, cashFlow - monthlySavings);
    const sortFn = debtMethod === "avalanche" ? (a, b) => b.apr - a.apr : debtMethod === "snowball" ? (a, b) => a.balance - b.balance : (a, b) => b.apr * 0.6 + b.balance / 1000 * 0.4 - (a.apr * 0.6 + a.balance / 1000 * 0.4);
    const sortedDebts = [...debtData].sort(sortFn);
    let remainingBalances = sortedDebts.map(d => ({
      ...d,
      balance: d.balance
    }));
    let months = 0;
    let totalInterest = 0;
    let allocation = sortedDebts.map(d => ({
      name: d.name,
      minPayment: d.minimum_payment,
      extra: 0,
      totalPayment: d.minimum_payment
    }));
    while (remainingBalances.some(d => d.balance > 0) && months < 120) {
      let monthlyInterest = 0;
      remainingBalances.forEach((debt, index) => {
        if (debt.balance <= 0) return;
        const interest = debt.balance * (debt.apr / 100 / 12);
        monthlyInterest += interest;
        debt.balance += interest;
        const payment = debt.minimum_payment + (index === 0 ? extraForDebt : 0);
        allocation[index].totalPayment += payment;
        allocation[index].extra += index === 0 ? extraForDebt : 0;
        debt.balance = Math.max(0, debt.balance - payment);
      });
      totalInterest += monthlyInterest;
      months++;
    }
    const monthsToEmergency = monthlySavings > 0 ? ((totalExpenses * 3 - savingsTotal) / monthlySavings).toFixed(1) : "N/A";
    return {
      sortedDebts,
      allocation,
      months,
      totalInterest: Math.round(totalInterest),
      monthsToEmergency,
      extraForDebt
    };
  }, [debtData, cashFlow, monthlySavings, debtMethod, totalExpenses, savingsTotal]);
  if (!debtStrategy) return <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t.debtPlanner}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">No debts to plan</p>
        </CardContent>
      </Card>;
  return <div className="space-y-6">
      {/* SLIDER AHORROS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t.monthlySavings}</CardTitle>
        </CardHeader>
        <CardContent>
          <Slider value={[monthlySavings]} onValueChange={value => setMonthlySavings(value[0])} max={Math.max(cashFlow, 0)} step={50} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>£0</span>
            <span className="font-medium">{formatCurrency(monthlySavings)}</span>
            <span>{formatCurrency(Math.max(cashFlow, 0))}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t.cashFlowAfterSavings}: {formatCurrency(cashFlow - monthlySavings)}
          </p>
        </CardContent>
      </Card>

      {/* FONDO DE EMERGENCIA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t.emergencyFund}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Goal (3 months expenses):</span>
              <span className="font-bold">{formatCurrency(totalExpenses * 3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Current:</span>
              <span className="font-bold text-green-600">{formatCurrency(savingsTotal)}</span>
            </div>
            <Progress value={savingsTotal / (totalExpenses * 3) * 100} />
            <p className="text-sm text-muted-foreground">
              {t.monthsToEmergency}: {debtStrategy.monthsToEmergency}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PRIORIDAD DE DEUDAS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t.priority}</span>
            <Select value={debtMethod} onValueChange={value => setDebtMethod(value as DebtMethod)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avalanche">
                  <Zap className="mr-2 h-4 w-4" />
                  {t.avalanche}
                </SelectItem>
                <SelectItem value="snowball">
                  <Snowflake className="mr-2 h-4 w-4" />
                  {t.snowball}
                </SelectItem>
                <SelectItem value="hybrid">
                  <Zap className="mr-2 h-4 w-4" />
                  {t.hybrid}
                </SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {debtStrategy.sortedDebts.map((debt, index) => <div key={debt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{debt.name}</p>
                    <p className="text-sm text-muted-foreground">
                      APR {debt.apr}% • Balance {formatCurrency(debt.balance)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">{formatCurrency(debt.minimum_payment)}</p>
                  <p className="text-xs text-muted-foreground">{t.minPayment}</p>
                  <p className="text-xs font-medium text-emerald-600">
                    Extra: {formatCurrency(debtStrategy.allocation[index].extra)}
                  </p>
                  <p className="text-xs font-medium text-indigo-600">
                    Total: {formatCurrency(debtStrategy.allocation[index].totalPayment)}
                  </p>
                </div>
              </div>)}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Total extra for debt:</strong> {formatCurrency(debtStrategy.extraForDebt)} |{" "}
              <strong>Time to debt-free:</strong> {debtStrategy.months} {t.months} | <strong>{t.totalInterest}:</strong>{" "}
              {formatCurrency(debtStrategy.totalInterest)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Index;