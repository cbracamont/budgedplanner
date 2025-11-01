// src/pages/Index.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Globe,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Language = "en" | "es" | "pl" | "pt";

type Event = {
  id: string;
  date: string;
  type: "income" | "debt" | "fixed" | "variable" | "annual";
  name: string;
  amount: number;
  recurring?: "monthly" | "annually";
};

const translations = {
  en: {
    title: "Family Budget Planner UK",
    welcome: "Hi, {name}!",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    cashFlow: "Cash Flow",
    totalSavings: "Total Savings",
    addEvent: "Add Event",
    editEvent: "Edit Event",
    deleteEvent: "Delete Event?",
    name: "Name",
    amount: "Amount (£)",
    type: "Type",
    income: "Income",
    debt: "Debt",
    fixed: "Fixed",
    variable: "Variable",
    annual: "Annual",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    aiPlaceholder: "Ask AI about savings, debt, budget...",
    send: "Send",
    export: "Export Data",
    print: "Print",
    logout: "Logout",
    overview: "Overview",
    incomeTab: "Income",
    expenses: "Expenses",
    debts: "Debts",
    variableIncome: "Variable Income",
    add: "Add",
    description: "Description",
    noVariableIncome: "No variable income yet",
    healthy: "Healthy",
    review: "Review",
    disclaimer: "This app is for educational use only. Not financial advice. Consult an FCA adviser.",
    copyright: "© 2025 Family Budget Planner UK",
  },
  es: {
    title: "Planificador de Presupuesto Familiar UK",
    welcome: "¡Hola, {name}!",
    totalIncome: "Ingresos Totales",
    totalExpenses: "Gastos Totales",
    cashFlow: "Flujo de Caja",
    totalSavings: "Ahorros Totales",
    addEvent: "Añadir Evento",
    editEvent: "Editar Evento",
    deleteEvent: "¿Borrar evento?",
    name: "Nombre",
    amount: "Cantidad (£)",
    type: "Tipo",
    income: "Ingreso",
    debt: "Deuda",
    fixed: "Fijo",
    variable: "Variable",
    annual: "Anual",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Borrar",
    aiPlaceholder: "Pregunta a la IA sobre ahorros, deudas, presupuesto...",
    send: "Enviar",
    export: "Exportar Datos",
    print: "Imprimir",
    logout: "Salir",
    overview: "Resumen",
    incomeTab: "Ingresos",
    expenses: "Gastos",
    debts: "Deudas",
    variableIncome: "Ingresos Variables",
    add: "Añadir",
    description: "Descripción",
    noVariableIncome: "Aún no hay ingresos variables",
    healthy: "Saludable",
    review: "Revisar",
    disclaimer: "Esta app es solo educativa. No es asesoramiento financiero. Consulta a un asesor FCA.",
    copyright: "© 2025 Planificador de Presupuesto Familiar UK",
  },
  pl: {
    title: "Planer Budżetu Rodzinnego UK",
    welcome: "Cześć, {name}!",
    totalIncome: "Całkowity Dochód",
    totalExpenses: "Całkowite Wydatki",
    cashFlow: "Przepływ Gotówki",
    totalSavings: "Całkowite Oszczędności",
    addEvent: "Dodaj Wydarzenie",
    editEvent: "Edytuj Wydarzenie",
    deleteEvent: "Usunąć wydarzenie?",
    name: "Nazwa",
    amount: "Kwota (£)",
    type: "Typ",
    income: "Dochód",
    debt: "Dług",
    fixed: "Stały",
    variable: "Zmienny",
    annual: "Roczny",
    save: "Zapisz",
    cancel: "Anuluj",
    delete: "Usuń",
    aiPlaceholder: "Zapytaj AI o oszczędności, długi, budżet...",
    send: "Wyślij",
    export: "Eksportuj Dane",
    print: "Drukuj",
    logout: "Wyloguj",
    overview: "Przegląd",
    incomeTab: "Dochody",
    expenses: "Wydatki",
    debts: "Długi",
    variableIncome: "Dochody Zmiennie",
    add: "Dodaj",
    description: "Opis",
    noVariableIncome: "Brak dochodów zmiennych",
    healthy: "Zdrowy",
    review: "Przejrzyj",
    disclaimer: "Ta aplikacja jest tylko edukacyjna. Nie jest poradą finansową. Skonsultuj się z doradcą FCA.",
    copyright: "© 2025 Planer Budżetu Rodzinnego UK",
  },
  pt: {
    title: "Planejador de Orçamento Familiar UK",
    welcome: "Olá, {name}!",
    totalIncome: "Rendimento Total",
    totalExpenses: "Despesas Totais",
    cashFlow: "Fluxo de Caixa",
    totalSavings: "Poupanças Totais",
    addEvent: "Adicionar Evento",
    editEvent: "Editar Evento",
    deleteEvent: "Apagar evento?",
    name: "Nome",
    amount: "Valor (£)",
    type: "Tipo",
    income: "Rendimento",
    debt: "Dívida",
    fixed: "Fixo",
    variable: "Variável",
    annual: "Anual",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Apagar",
    aiPlaceholder: "Pergunte à IA sobre poupanças, dívidas, orçamento...",
    send: "Enviar",
    export: "Exportar Dados",
    print: "Imprimir",
    logout: "Sair",
    overview: "Visão Geral",
    incomeTab: "Rendimentos",
    expenses: "Despesas",
    debts: "Dívidas",
    variableIncome: "Rendimentos Variáveis",
    add: "Adicionar",
    description: "Descrição",
    noVariableIncome: "Ainda não há rendimentos variáveis",
    healthy: "Saudável",
    review: "Rever",
    disclaimer: "Esta app é apenas educativa. Não é aconselhamento financeiro. Consulte um consultor FCA.",
    copyright: "© 2025 Planejador de Orçamento Familiar UK",
  },
};

// === VARIABLE INCOME HOOK ===
const useVariableIncome = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("variable_income");
    if (saved) setData(JSON.parse(saved));
  }, []);

  const addIncome = useCallback((amount: number, description: string) => {
    const newEntry = {
      id: Date.now().toString(),
      amount,
      description: description || "Extra income",
      date: new Date().toISOString(),
    };
    setData((prev) => {
      const updated = [newEntry, ...prev];
      localStorage.setItem("variable_income", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setData((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      localStorage.setItem("variable_income", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { data, addIncome, deleteIncome };
};

const Index = () => {
  useTheme();

  // === 1. TODOS LOS HOOKS ANTES DE RETURN ===
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [recurringManualEvents, setRecurringManualEvents] = useState<Event[]>([]);
  const [annualEvents, setAnnualEvents] = useState<Event[]>([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<{
    name: string;
    amount: number;
    type: "income" | "debt" | "fixed" | "variable" | "annual";
  }>({ name: "", amount: 0, type: "income" });

  const { data: profiles = [] } = useFinancialProfiles();
  const activeProfile = useMemo(() => profiles.find((p) => p.is_active) || { name: "Family" }, [profiles]);

  const { data: incomeData = [] } = useIncomeSources();
  const { data: debtData = [] } = useDebts();
  const { data: fixedExpensesData = [] } = useFixedExpenses();
  const { data: variableExpensesData = [] } = useVariableExpenses();
  const { data: savingsGoalsData = [] } = useSavingsGoals();
  const { data: savings } = useSavings();
  const { data: variableIncome = [], addIncome, deleteIncome } = useVariableIncome();

  // Cargar eventos
  useEffect(() => {
    const loadEvents = () => {
      const manual = localStorage.getItem("recurring_manual_events");
      const annual = localStorage.getItem("annual_events");
      if (manual) setRecurringManualEvents(JSON.parse(manual));
      if (annual) setAnnualEvents(JSON.parse(annual));
    };
    loadEvents();
  }, []);

  // Autenticación
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
  }, []);

  // === CÁLCULOS ===
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

    const pieData = [
      { name: "Fixed", value: totalFixed, color: "#3b82f6" },
      { name: "Variable", value: totalVariable, color: "#10b981" },
      { name: "Debt", value: totalDebtPayment, color: "#ef4444" },
    ].filter((d) => d.value > 0);

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
            recurring: "monthly",
          });
        });

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
            recurring: "monthly",
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
            recurring: "monthly",
          });
        });

        recurringManualEvents.forEach((event) => {
          const [_, __, dayStr] = event.date.split("-");
          const day = parseInt(dayStr);
          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
          if (day <= lastDayOfMonth) {
            const date = new Date(year, month, day);
            allEvents.push({
              id: `man-${event.id}-${year}-${month}`,
              date: format(date, "yyyy-MM-dd"),
              type: event.type,
              name: event.name,
              amount: event.amount,
              recurring: "monthly",
            });
          }
        });

        annualEvents.forEach((event) => {
          const [eventYear, eventMonth, eventDay] = event.date.split("-").map(Number);
          if (eventYear === year && eventMonth - 1 === month) {
            const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
            const day = Math.min(eventDay, lastDayOfMonth);
            const date = new Date(year, month, day);
            allEvents.push({
              id: `ann-${event.id}-${year}`,
              date: format(date, "yyyy-MM-dd"),
              type: event.type,
              name: event.name,
              amount: event.amount,
              recurring: "annually",
            });
          }
        });
      }
    }

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
    recurringManualEvents,
    annualEvents,
  ]);

  const t = translations[language];

  const formatCurrency = useCallback((amount: number) => `£${amount.toFixed(0)}`, []);

  const getEventsForDay = useCallback(
    (date: Date) => calendarEvents.filter((e) => isSameDay(new Date(e.date), date)),
    [calendarEvents],
  );

  const handleAddEvent = useCallback(() => {
    setEditingEvent(null);
    setNewEvent({ name: "", amount: 0, type: "income" });
    setSelectedDate(new Date());
    setShowEventDialog(true);
  }, []);

  const handleEditEvent = useCallback((event: Event) => {
    setEditingEvent(event);
    setNewEvent({ name: event.name, amount: event.amount, type: event.type });
    setShowEventDialog(true);
  }, []);

  const saveEvent = useCallback(() => {
    if (!newEvent.name || !newEvent.amount) return;

    const eventDate = selectedDate || new Date();
    const baseEvent: Event = {
      id: editingEvent?.id || Date.now().toString(),
      date: format(eventDate, "yyyy-MM-dd"),
      type: newEvent.type,
      name: newEvent.name,
      amount: newEvent.amount,
      recurring: newEvent.type === "annual" ? "annually" : "monthly",
    };

    if (newEvent.type === "annual") {
      setAnnualEvents((prev) => {
        const updated = editingEvent
          ? prev.map((e) => (e.id === editingEvent.id ? baseEvent : e))
          : [...prev, baseEvent];
        localStorage.setItem("annual_events", JSON.stringify(updated));
        return updated;
      });
    } else {
      setRecurringManualEvents((prev) => {
        const updated = editingEvent
          ? prev.map((e) => (e.id === editingEvent.id ? baseEvent : e))
          : [...prev, baseEvent];
        localStorage.setItem("recurring_manual_events", JSON.stringify(updated));
        return updated;
      });
    }

    setShowEventDialog(false);
    setNewEvent({ name: "", amount: 0, type: "income" });
    setEditingEvent(null);
  }, [selectedDate, newEvent, editingEvent]);

  const confirmDelete = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const executeDelete = useCallback(() => {
    if (!deleteId) return;
    const parts = deleteId.split("-");
    const prefix = parts[0];
    const baseId = parts.slice(1, parts.length - 2).join("-");

    if (prefix === "ann") {
      setAnnualEvents((prev) => {
        const updated = prev.filter((e) => e.id !== baseId);
        localStorage.setItem("annual_events", JSON.stringify(updated));
        return updated;
      });
    } else if (prefix === "man") {
      setRecurringManualEvents((prev) => {
        const updated = prev.filter((e) => e.id !== baseId);
        localStorage.setItem("recurring_manual_events", JSON.stringify(updated));
        return updated;
      });
    }
    setDeleteId(null);
  }, [deleteId]);

  const sendToAI = useCallback(() => {
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
      } else {
        response = `I see you're asking about "${aiInput}".\n\nQuick tip: Track every expense for 30 days. Most families find £100-200 in hidden waste.`;
      }

      setAiResponse(response);
      setAiLoading(false);
    }, 800);
  }, [aiInput, totalVariable, cashFlow, monthsToDebtFree]);

  const exportData = useCallback(() => {
    const data = {
      incomeData,
      debtData,
      fixedExpensesData,
      variableExpensesData,
      savingsGoalsData,
      variableIncome,
      recurringManualEvents,
      annualEvents,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    incomeData,
    debtData,
    fixedExpensesData,
    variableExpensesData,
    savingsGoalsData,
    variableIncome,
    recurringManualEvents,
    annualEvents,
  ]);

  const { monthDays, blankDays } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const blankDays = Array(monthStart.getDay()).fill(null);
    return { monthDays, blankDays };
  }, [currentMonth]);

  // === EARLY RETURNS ===
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // === RENDER PRINCIPAL ===
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
                {t.title}
              </h1>
              <p className="text-muted-foreground">{t.welcome.replace("{name}", activeProfile.name)}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* IDIOMA DESPLEGABLE */}
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <Globe className="inline h-4 w-4 mr-2" />
                    English
                  </SelectItem>
                  <SelectItem value="es">
                    <Globe className="inline h-4 w-4 mr-2" />
                    Español
                  </SelectItem>
                  <SelectItem value="pl">
                    <Globe className="inline h-4 w-4 mr-2" />
                    Polski
                  </SelectItem>
                  <SelectItem value="pt">
                    <Globe className="inline h-4 w-4 mr-2" />
                    Português
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={() => window.print()} title={t.print}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={exportData} title={t.export}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowAI(true)} title="AI">
                <Bot className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => supabase.auth.signOut()} title={t.logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* RESUMEN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600">{t.totalIncome}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600">{t.totalExpenses}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
              </CardContent>
            </Card>
            <Card className={`${cashFlow >= 0 ? "border-emerald-200" : "border-orange-200"}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm ${cashFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                  {t.cashFlow}
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
                <CardTitle className="text-sm text-purple-600 flex items-center gap-1">
                  <PiggyBank className="h-4 w-4" /> {t.totalSavings}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{formatCurrency(savingsTotal)}</div>
              </CardContent>
            </Card>
          </div>

          {/* CALENDARIO INTERACTIVO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> {format(currentMonth, "MMMM yyyy")}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCurrentMonth(sub(currentMonth, { months: 1 }))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCurrentMonth(add(currentMonth, { months: 1 }))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleAddEvent}>
                    <Plus className="h-4 w-4 mr-1" /> {t.add}
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
                  <div key={`blank-${i}`} className="h-20 border rounded" />
                ))}
                {monthDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`h-20 border rounded p-1 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isSameDay(day, new Date()) ? "bg-blue-50 dark:bg-blue-900" : ""}`}
                      onClick={() => {
                        setSelectedDate(day);
                        setShowEventDialog(true);
                        setEditingEvent(null);
                        setNewEvent({ name: "", amount: 0, type: "income" });
                      }}
                    >
                      <div className="font-medium">{format(day, "d")}</div>
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <div
                          key={i}
                          className={`text-[9px] truncate flex justify-between items-center ${e.type === "income" ? "text-green-600" : e.type === "debt" ? "text-red-600" : "text-blue-600"}`}
                        >
                          <span>{e.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleEditEvent(e);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI DIALOG */}
          <Dialog open={showAI} onOpenChange={setShowAI}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Assistant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder={t.aiPlaceholder}
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="min-h-24"
                />
                <Button onClick={sendToAI} disabled={aiLoading} className="w-full">
                  <Send className="h-4 w-4 mr-2" /> {t.send}
                </Button>
                {aiLoading && <p className="text-center text-sm text-muted-foreground">Thinking...</p>}
                {aiResponse && <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">{aiResponse}</div>}
              </div>
            </DialogContent>
          </Dialog>

          {/* EVENT DIALOG */}
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEvent ? t.editEvent : t.addEvent}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t.name}</Label>
                  <Input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
                </div>
                <div>
                  <Label>{t.amount}</Label>
                  <Input
                    type="number"
                    value={newEvent.amount}
                    onChange={(e) => setNewEvent({ ...newEvent, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>{t.type}</Label>
                  <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">{t.income}</SelectItem>
                      <SelectItem value="debt">{t.debt}</SelectItem>
                      <SelectItem value="fixed">{t.fixed}</SelectItem>
                      <SelectItem value="variable">{t.variable}</SelectItem>
                      <SelectItem value="annual">{t.annual}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                  {t.cancel}
                </Button>
                <Button onClick={saveEvent}>{t.save}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* DELETE CONFIRM */}
          <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.deleteEvent}</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteId(null)}>
                  {t.cancel}
                </Button>
                <Button variant="destructive" onClick={executeDelete}>
                  {t.delete}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <footer className="no-print py-8 text-center text-xs text-muted-foreground border-t mt-12">
            <p className="font-semibold mb-2">Legal Disclaimer (UK)</p>
            <p>{t.disclaimer}</p>
            <p className="mt-2">{t.copyright}</p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Index;
