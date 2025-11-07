"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  add,
  sub,
  startOfWeek,
} from "date-fns";
import { formatCurrency } from "@/lib/i18n";
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
  Moon,
  Sun,
  PoundSterling,
  Shield,
  AlertCircle,
  Wallet,
  LayoutDashboard,
  Receipt,
  CreditCard,
  Goal,
  Settings,
} from "lucide-react";
import {
  useIncomeSources,
  useDebts,
  useFixedExpenses,
  useVariableExpenses,
  useSavingsGoals,
  useSavings,
  useAddIncome,
  useAddDebt,
  useAddFixedExpense,
  useAddVariableExpense,
  useAddSavingsGoal,
} from "@/hooks/useFinancialData";
import { toast } from "@/hooks/use-toast";
import { useFinancialProfiles } from "@/hooks/useFinancialProfiles";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
import { VariableIncomeManager } from "@/components/VariableIncomeManager";
import { SavingsManager } from "@/components/SavingsManager";
import { SavingsGoalsManager } from "@/components/SavingsGoalsManager";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { MobileMenu } from "@/components/MobileMenu";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { useTheme as useNextTheme } from "next-themes";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Language } from "@/lib/i18n";
type DebtMethod = "avalanche" | "snowball" | "hybrid";
type Event = {
  id: string;
  date: string;
  type: "income" | "debt" | "fixed" | "variable" | "savings";
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
    monthlyDebtAllocation: "Monthly Debt Allocation",
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
    monthlyDebtAllocation: "Asignación Mensual de Deuda",
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
    monthlyDebtAllocation: "Miesięczna Alokacja Długu",
  },
};
// Variable income hook moved to src/hooks/useVariableIncome.ts for security
const Index = () => {
  useTheme();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useNextTheme();
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [newIncome, setNewIncome] = useState({
    description: "",
    amount: 0,
  });
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [debtMethod, setDebtMethod] = useState<DebtMethod>("avalanche");
  const [events, setEvents] = useState<Event[]>([]);
  const [addMoneyGoalId, setAddMoneyGoalId] = useState<string | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState(0);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalData, setEditGoalData] = useState<{
    current_amount: number;
    target_amount: number;
  }>({
    current_amount: 0,
    target_amount: 0,
  });
  const [showAddEmergencyFund, setShowAddEmergencyFund] = useState(false);
  const [emergencyFundAmount, setEmergencyFundAmount] = useState(0);
  const [showEditEmergencyFund, setShowEditEmergencyFund] = useState(false);
  const [editEmergencyFundAmount, setEditEmergencyFundAmount] = useState(0);
  const [newEvent, setNewEvent] = useState<{
    name: string;
    amount: number;
    type: "income" | "debt" | "fixed" | "variable" | "savings";
    recurring: boolean;
    payment_day: number;
    frequency: string;
    apr?: number;
    minimum_payment?: number;
    balance?: number;
    target_amount?: number;
    target_date?: string;
  }>({
    name: "",
    amount: 0,
    type: "income",
    recurring: false,
    payment_day: 1,
    frequency: "monthly",
  });
  const { data: profiles = [] } = useFinancialProfiles();
  const activeProfile = useMemo(
    () =>
      profiles.find((p) => p.is_active) || {
        name: "Family",
      },
    [profiles],
  );
  const { data: incomeData = [] } = useIncomeSources();
  const { data: debtData = [] } = useDebts();
  const { data: fixedExpensesData = [] } = useFixedExpenses();
  const { data: variableExpensesData = [] } = useVariableExpenses();
  const { data: savingsGoalsData = [] } = useSavingsGoals();
  const { data: savings } = useSavings();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const handlePrevWeek = () => {
    setCurrentWeekOffset((prev) => prev - 1);
  };
  const handleNextWeek = () => {
    setCurrentWeekOffset((prev) => prev + 1);
  };

  // Fetch variable income separately
  const { data: variableIncomeData = [] } = useQuery({
    queryKey: ["variable-income"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("income_sources")
        .select("*")
        .eq("user_id", user.id)
        .eq("income_type", "variable")
        .order("created_at", {
          ascending: false,
        });
      if (error) throw error;
      return data || [];
    },
  });

  // Mutation hooks for adding financial data
  const addIncomeMutation = useAddIncome();
  const addDebtMutation = useAddDebt();
  const addFixedExpenseMutation = useAddFixedExpense();
  const addVariableExpenseMutation = useAddVariableExpense();
  const addSavingsGoalMutation = useAddSavingsGoal();
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
    const totalIncome = incomeData.reduce((s, i) => s + i.amount, 0);

    // Calculate total variable income based on frequency
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthNum = currentDate.getMonth();
    const totalVariableIncome = variableIncomeData.reduce((sum, inc) => {
      if (inc.frequency === "weekly") {
        // Count how many times this day of week occurs in current month
        const daysInMonth = new Date(currentYear, currentMonthNum + 1, 0).getDate();
        let count = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(currentYear, currentMonthNum, day);
          if (date.getDay() === inc.day_of_week) {
            count++;
          }
        }
        return sum + inc.amount * count;
      }
      return sum + inc.amount;
    }, 0);
    const totalFixed = fixedExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalVariable = variableExpensesData.reduce((s, e) => s + e.amount, 0);
    const totalDebtPayment = debtData.reduce((s, d) => s + d.minimum_payment, 0);
    const totalExpenses = totalFixed + totalVariable + totalDebtPayment;

    // Calculate total active monthly contributions from savings goals
    const totalSavingsCommitments = savingsGoalsData
      .filter((g) => g.is_active && g.monthly_contribution)
      .reduce((s, g) => s + (g.monthly_contribution || 0), 0);

    // Deduct savings commitments from cashflow, include variable income
    const grossCashFlow = totalIncome + totalVariableIncome - totalExpenses;
    const cashFlow = grossCashFlow - totalSavingsCommitments;
    const savingsTotal =
      (savings?.emergency_fund || 0) + savingsGoalsData.reduce((s, g) => s + (g.current_amount || 0), 0);
    let remaining = debtData.reduce((s, d) => s + d.balance, 0);
    let months = 0;

    // Calculate extra payment for debt, accounting for savings commitments
    const availableForDebt = Math.max(0, grossCashFlow - monthlySavings - totalSavingsCommitments);
    const extra = Math.max(0, availableForDebt * 0.3);
    const monthlyPay = totalDebtPayment + extra;
    while (remaining > 0 && months < 120) {
      const interest = debtData.reduce((s, d) => s + d.balance * (d.apr / 100 / 12), 0);
      remaining = Math.max(0, remaining + interest - monthlyPay);
      months++;
    }
    const monthsToDebtFree = months;
    const debtFreeDate = addMonths(new Date(), months);
    const pieData = [
      {
        name: "Fixed",
        value: totalFixed,
        color: "#3b82f6",
      },
      {
        name: "Variable",
        value: totalVariable,
        color: "#10b981",
      },
      {
        name: "Debt",
        value: totalDebtPayment,
        color: "#ef4444",
      },
    ].filter((d) => d.value > 0);

    // CALENDARIO CON EVENTOS EN TODOS LOS MESES
    const allEvents: Event[] = [];
    const startYear = currentMonth.getFullYear() - 1;
    const endYear = currentMonth.getFullYear() + 1;
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const currentDate = new Date(year, month, 1);
        if (currentDate > new Date(endYear, 11, 31)) break;

        // INGRESOS FIJOS - payment_day
        incomeData.forEach((inc) => {
          const day = inc.payment_day || 1;
          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
          const date = new Date(year, month, Math.min(day, lastDayOfMonth));
          allEvents.push({
            id: `inc-${inc.id}-${year}-${month}`,
            date: format(date, "yyyy-MM-dd"),
            type: "income",
            name: inc.name,
            amount: inc.amount,
            recurring: true,
          });
        });

        // VARIABLE INCOME - Based on frequency and payment_day/day_of_week
        variableIncomeData.forEach((inc) => {
          if (inc.frequency === "weekly" && inc.day_of_week !== undefined) {
            // For weekly, add event for each occurrence of the day in the month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
              const date = new Date(year, month, day);
              if (date.getDay() === inc.day_of_week) {
                allEvents.push({
                  id: `var-inc-${inc.id}-${year}-${month}-${day}`,
                  date: format(date, "yyyy-MM-dd"),
                  type: "income",
                  name: `${inc.name} (weekly)`,
                  amount: inc.amount,
                  recurring: true,
                });
              }
            }
          } else {
            // For other frequencies, check if should be included in this month
            const shouldInclude = (() => {
              switch (inc.frequency) {
                case "monthly":
                  return true;
                case "quarterly":
                  return month % 3 === 0;
                case "semi-annually":
                  return month % 6 === 0;
                case "annually":
                  return month === 0;
                default:
                  return true;
              }
            })();
            if (shouldInclude) {
              const day = inc.payment_day || 1;
              const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
              const date = new Date(year, month, Math.min(day, lastDayOfMonth));
              allEvents.push({
                id: `var-inc-${inc.id}-${year}-${month}`,
                date: format(date, "yyyy-MM-dd"),
                type: "income",
                name: `${inc.name} (${inc.frequency})`,
                amount: inc.amount,
                recurring: true,
              });
            }
          }
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

        // GASTOS VARIABLES - Día 10
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
    const monthDays = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
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
      debtFreeDate,
      monthsToDebtFree,
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
    fixedExpensesData,
    variableExpensesData,
    debtData,
    savings,
    savingsGoalsData,
    currentMonth,
    monthlySavings,
  ]);
  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (authLoading)
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!user) return <Auth />;
  const getEventsForDay = (date: Date) => calendarEvents.filter((e) => isSameDay(new Date(e.date), date));
  const resetEventForm = () => {
    setNewEvent({
      name: "",
      amount: 0,
      type: "income",
      recurring: false,
      payment_day: 1,
      frequency: "monthly",
    });
  };
  const addEvent = async () => {
    if (!selectedDate || !newEvent.name || newEvent.amount <= 0) return;
    try {
      switch (newEvent.type) {
        case "income":
          await addIncomeMutation.mutateAsync({
            name: newEvent.name,
            amount: newEvent.amount,
            payment_day: newEvent.payment_day,
          });
          break;
        case "debt":
          if (!newEvent.balance || !newEvent.apr || !newEvent.minimum_payment) {
            toast({
              title: "Missing Information",
              description: "Please fill in all debt fields",
              variant: "destructive",
            });
            return;
          }
          await addDebtMutation.mutateAsync({
            name: newEvent.name,
            balance: newEvent.balance,
            apr: newEvent.apr,
            minimum_payment: newEvent.minimum_payment,
            payment_day: newEvent.payment_day,
          });
          break;
        case "fixed":
          await addFixedExpenseMutation.mutateAsync({
            name: newEvent.name,
            amount: newEvent.amount,
            payment_day: newEvent.payment_day,
            frequency_type: newEvent.frequency,
          });
          break;
        case "variable":
          await addVariableExpenseMutation.mutateAsync({
            name: newEvent.name,
            amount: newEvent.amount,
          });
          break;
        case "savings":
          if (!newEvent.target_amount) {
            toast({
              title: "Missing Information",
              description: "Please enter a target amount for savings goal",
              variant: "destructive",
            });
            return;
          }
          await addSavingsGoalMutation.mutateAsync({
            goal_name: newEvent.name,
            target_amount: newEvent.target_amount,
            current_amount: newEvent.amount,
            target_date: newEvent.target_date || null,
          });
          break;
      }
      setShowEventDialog(false);
      resetEventForm();
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };
  const updateEvent = () => {
    // For now, just close the dialogue as editing existing entries
    // should be done through their respective managers
    setEditingEvent(null);
    setShowEventDialog(false);
    resetEventForm();
  };
  const deleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
    setDeleteId(null);
  };
  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase.from("savings_goals").delete().eq("id", goalId);
      if (error) throw error;

      // Invalidate and refetch savings goals
      await queryClient.invalidateQueries({
        queryKey: ["savings_goals"],
      });
      toast({
        title: "Success",
        description: "Savings goal deleted successfully",
      });
      setDeleteGoalId(null);
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Error",
        description: "Failed to delete savings goal",
        variant: "destructive",
      });
    }
  };
  const handleAddMoney = async () => {
    if (!addMoneyGoalId || addMoneyAmount <= 0) return;
    try {
      const goal = savingsGoalsData.find((g) => g.id === addMoneyGoalId);
      if (!goal) return;
      const newAmount = goal.current_amount + addMoneyAmount;
      const { error } = await supabase
        .from("savings_goals")
        .update({
          current_amount: newAmount,
        })
        .eq("id", addMoneyGoalId);
      if (error) throw error;

      // Invalidate and refetch savings goals
      await queryClient.invalidateQueries({
        queryKey: ["savings_goals"],
      });
      toast({
        title: "Success",
        description: `Added ${formatCurrency(addMoneyAmount)} to ${goal.goal_name}`,
      });
      setAddMoneyGoalId(null);
      setAddMoneyAmount(0);
    } catch (error) {
      console.error("Error adding money:", error);
      toast({
        title: "Error",
        description: "Failed to add money to savings goal",
        variant: "destructive",
      });
    }
  };
  const handleEditGoal = async () => {
    if (!editingGoalId) return;
    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({
          current_amount: editGoalData.current_amount,
          target_amount: editGoalData.target_amount,
        })
        .eq("id", editingGoalId);
      if (error) throw error;
      await queryClient.invalidateQueries({
        queryKey: ["savings_goals"],
      });
      toast({
        title: "Success",
        description: "Goal amounts updated successfully",
      });
      setEditingGoalId(null);
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Error",
        description: "Failed to update goal amounts",
        variant: "destructive",
      });
    }
  };
  const handleAddEmergencyFund = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || emergencyFundAmount <= 0) return;
    try {
      const currentEmergencyFund = savings?.emergency_fund || 0;
      const newTotal = currentEmergencyFund + emergencyFundAmount;
      const { error } = await supabase.from("savings").upsert({
        id: savings?.id,
        user_id: user.id,
        profile_id: "id" in activeProfile ? activeProfile.id : null,
        emergency_fund: newTotal,
        monthly_goal: savings?.monthly_goal || 0,
        total_accumulated: savings?.total_accumulated || 0,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({
        queryKey: ["savings"],
      });
      toast({
        title: "Success",
        description: `Added ${formatCurrency(emergencyFundAmount)} to emergency fund`,
      });
      setShowAddEmergencyFund(false);
      setEmergencyFundAmount(0);
    } catch (error) {
      console.error("Error adding to emergency fund:", error);
      toast({
        title: "Error",
        description: "Failed to add to emergency fund",
        variant: "destructive",
      });
    }
  };
  const handleEditEmergencyFund = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || editEmergencyFundAmount < 0) return;
    try {
      const { error } = await supabase.from("savings").upsert({
        id: savings?.id,
        user_id: user.id,
        profile_id: "id" in activeProfile ? activeProfile.id : null,
        emergency_fund: editEmergencyFundAmount,
        monthly_goal: savings?.monthly_goal || 0,
        total_accumulated: savings?.total_accumulated || 0,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({
        queryKey: ["savings"],
      });
      toast({
        title: "Success",
        description: `Emergency fund updated to ${formatCurrency(editEmergencyFundAmount)}`,
      });
      setShowEditEmergencyFund(false);
      setEditEmergencyFundAmount(0);
    } catch (error) {
      console.error("Error updating emergency fund:", error);
      toast({
        title: "Error",
        description: "Failed to update emergency fund",
        variant: "destructive",
      });
    }
  };
  const sendToAI = () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setTimeout(() => {
      const lower = aiInput.toLowerCase();
      let response = "";
      if (lower.includes("save")) response = `Cut £50-100 from variable expenses (£${totalVariable}).`;
      else if (lower.includes("debt")) response = `Pay highest APR first. Debt-free in ${monthsToDebtFree} months.`;
      else response = `Track every expense for 30 days.`;
      setAiResponse(response);
      setAiLoading(false);
    }, 800);
  };
  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <ScrollToTop />
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* HEADER */}
          <div className="no-print flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <Home className="h-12 w-12" /> Family Budget Planner UK
              </h1>
              <p className="text-muted-foreground">Hi, {activeProfile.name}!</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <LanguageToggle language={language} onLanguageChange={setLanguage} />
              <ProfileSelector language={language} />
              <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => window.print()}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => supabase.auth.signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* MOBILE MENU */}
          <MobileMenu
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              {
                value: "overview",
                label: "Overview",
                icon: <LayoutDashboard className="h-5 w-5" />,
              },
              {
                value: "income",
                label: "Income",
                icon: <PoundSterling className="h-5 w-5" />,
              },
              {
                value: "expenses",
                label: "Expenses",
                icon: <Receipt className="h-5 w-5" />,
              },
              {
                value: "debts",
                label: "Debts",
                icon: <CreditCard className="h-5 w-5" />,
              },
              {
                value: "savings",
                label: "Savings",
                icon: <Goal className="h-5 w-5" />,
              },
            ]}
            language={language}
            onLanguageChange={setLanguage}
            theme={theme}
            onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
            onExportData={() => window.print()}
            onLogout={() => supabase.auth.signOut()}
          />

          {/* TABS */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
            <TabsList className="hidden md:grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="debts">Debts and Loans</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* RESUMEN */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-600">Total Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                  </CardContent>
                </Card>
                <Card className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-600">Total Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                  </CardContent>
                </Card>
                <Card className={`${cashFlow >= 0 ? "border-emerald-200" : "border-orange-200"}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm ${cashFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
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
                    <CardTitle className="text-sm text-purple-600 flex items-center gap-1">
                      <PiggyBank className="h-4 w-4" /> Total Savings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{formatCurrency(savingsTotal)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Status - Multi-Stage */}
              <div className="text-center py-8">
                {(() => {
                  const status = (() => {
                    if (cashFlow > totalExpenses * 0.3)
                      return {
                        emoji: "🚀",
                        label: "Excellent",
                        color: "text-emerald-600",
                        progress: 95,
                        message: `Amazing! You're saving ${formatCurrency(cashFlow)} per month — 30%+ of expenses. Keep going!`,
                      };
                    if (cashFlow > totalExpenses * 0.1)
                      return {
                        emoji: "💪",
                        label: "Strong",
                        color: "text-green-600",
                        progress: 80,
                        message: `Great job! You have ${formatCurrency(cashFlow)} per month in disposable income — 10-30% of expenses. Solid foundation.`,
                      };
                    if (cashFlow > 0)
                      return {
                        emoji: "✅",
                        label: "Healthy",
                        color: "text-blue-600",
                        progress: 65,
                        message: `You're in the green! Saving ${formatCurrency(cashFlow)} per month. Small wins add up.`,
                      };
                    if (cashFlow > -totalExpenses * 0.1)
                      return {
                        emoji: "⚠️",
                        label: "Review",
                        color: "text-orange-600",
                        progress: 40,
                        message: `Close call! You're overspending by ${formatCurrency(Math.abs(cashFlow))} — less than 10% of expenses. Trim a little.`,
                      };
                    return {
                      emoji: "🔴",
                      label: "Critical",
                      color: "text-red-600",
                      progress: 20,
                      message: `Alert! Overspending by ${formatCurrency(Math.abs(cashFlow))} — over 10% of expenses. Cut now to avoid debt.`,
                    };
                  })();
                  return (
                    <div>
                      <div className={`text-7xl font-bold ${status.color} animate-scale-in`}>
                        {status.emoji} {status.label}
                      </div>
                      <Progress value={status.progress} className="mt-6 h-3" />
                      <p className="mt-4 text-muted-foreground">{status.message}</p>
                    </div>
                  );
                })()}
              </div>

              {/* GASTOS PASTEL */}
              {pieData.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      Expense Breakdown
                    </CardTitle>
                    <CardDescription className="text-sm">Monthly spending distribution with trends</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="relative flex items-center justify-center">
                        <div className="relative w-56 h-56 md:w-64 md:h-64">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-inner"></div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-300">
                              {formatCurrency(totalExpenses)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monthly Total</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center space-y-4">
                        {pieData.map((d, i) => {
                          const percent = ((d.value / totalExpenses) * 100).toFixed(1);
                          const trend =
                            d.value > totalExpenses * 0.2 ? "High" : d.value > totalExpenses * 0.1 ? "Medium" : "Low";
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full shadow-md"
                                  style={{
                                    backgroundColor: d.color,
                                  }}
                                />
                                <div>
                                  <p className="font-medium text-sm">{d.name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{percent}%</p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">{trend} impact</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm">{formatCurrency(d.value)}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Monthly</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-b-lg rounded-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Monthly Total</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {formatCurrency(totalExpenses)}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            <span>{((totalExpenses / totalIncome) * 100).toFixed(0)}% of income</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* DEBT FREE */}
              {debtData.length > 0 && (
                <Card className="border-2 rounded-bl-none rounded-md bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-200">
                      <TrendingUp className="h-6 w-6" /> Debt Free Date
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

              {/* PAYMENT TIMELINE - Next 3 Weeks */}
              <Card className="rounded-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Payment Timeline - This Week
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevWeek}
                      disabled={currentWeekOffset === 0 && new Date().getDay() === 0} // Disable if current week and Sunday
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextWeek}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const today = new Date(); // November 07, 2025
                    const currentWeekStart = startOfWeek(today, {
                      weekStartsOn: 0,
                    }); // Sunday start
                    const weekStart = add(currentWeekStart, {
                      weeks: currentWeekOffset,
                    });
                    const weekEnd = add(weekStart, {
                      days: 6,
                    });
                    const upcomingEvents = calendarEvents
                      .filter((e) => {
                        const eventDate = new Date(e.date);
                        return eventDate >= weekStart && eventDate <= weekEnd && e.type !== "variable"; // Exclude variable expenses
                      })
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    if (upcomingEvents.length === 0) {
                      return <p className="text-center text-muted-foreground py-8">No upcoming payments this week</p>;
                    }
                    return (
                      <>
                        {/* Week Header */}
                        <div className="text-center pb-4">
                          <h4 className="font-semibold text-sm text-muted-foreground">
                            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                          </h4>
                        </div>
                        {/* Vertical Timeline */}
                        <div className="relative space-y-4">
                          {/* Vertical line */}
                          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted opacity-60" />
                          {upcomingEvents.map((event, idx) => {
                            const eventDate = new Date(event.date);
                            const isToday = isSameDay(eventDate, today);
                            const isPast = eventDate < today;
                            return (
                              <div
                                key={event.id}
                                className={`relative pl-8 ${isPast ? "opacity-50" : isToday ? "opacity-100" : "opacity-70"}`}
                              >
                                {/* Timeline dot */}
                                <div
                                  className={`absolute left-[-10px] top-2 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center ${event.type === "income" ? "bg-green-500" : event.type === "debt" ? "bg-red-500" : event.type === "fixed" ? "bg-orange-500" : "bg-blue-500"} ${isToday ? "ring-4 ring-primary ring-offset-2 scale-125" : ""}`}
                                />
                                {/* Event card with description */}
                                <div
                                  className={`rounded-lg border p-3 transition-all hover:shadow-md w-full ${isToday ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "bg-card"}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-white">{event.name}</span>{" "}
                                        {/* Payment description */}
                                        {isToday && (
                                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                            Today
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{format(eventDate, "EEE, MMM d")}</span>
                                        <span>•</span>
                                        <span className="capitalize">{event.type}</span>
                                        {event.recurring && (
                                          <>
                                            <span>•</span>
                                            <span className="italic">Recurring</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div
                                      className={`text-right font-semibold ${event.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                    >
                                      {event.type === "income" ? "+" : "-"}£{event.amount.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Savings Goals Pots */}

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
                            <span
                              className={e.type === "income" ? "text-green-600 font-bold" : "text-red-600 font-bold"}
                            >
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
                                    recurring: e.recurring || false,
                                    payment_day: 1,
                                    frequency: "monthly",
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
                    <Button
                      variant="default"
                      onClick={() => {
                        setEditingEvent(null);
                        resetEventForm();
                        setShowEventDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Event
                    </Button>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* AGREGAR/EDITAR EVENTO */}
            <AlertDialog open={showEventDialog} onOpenChange={setShowEventDialog}>
              <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle>{editingEvent ? "Edit Event" : "Add Financial Entry"}</AlertDialogTitle>
                  <p className="text-sm text-muted-foreground">Create a new entry in your financial records</p>
                </AlertDialogHeader>
                <div className="space-y-4">
                  {/* Type Selection */}
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(v: Event["type"]) =>
                        setNewEvent({
                          ...newEvent,
                          type: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="fixed">Fixed Expense</SelectItem>
                        <SelectItem value="variable">Variable Expense</SelectItem>
                        <SelectItem value="debt">Debt</SelectItem>
                        <SelectItem value="savings">Savings Goal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Common Fields */}
                  <div>
                    <Label>{newEvent.type === "savings" ? "Goal Name" : "Name"}</Label>
                    <Input
                      value={newEvent.name}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          name: e.target.value,
                        })
                      }
                      placeholder={
                        newEvent.type === "income"
                          ? "e.g., Salary"
                          : newEvent.type === "debt"
                            ? "e.g., Credit Card"
                            : newEvent.type === "savings"
                              ? "e.g., Vacation"
                              : "e.g., Rent"
                      }
                    />
                  </div>

                  {/* Amount (not for debts) */}
                  {newEvent.type !== "debt" && (
                    <div>
                      <Label>{newEvent.type === "savings" ? "Current Saved Amount (£)" : "Amount (£)"}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newEvent.amount || ""}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Debt-specific fields */}
                  {newEvent.type === "debt" && (
                    <>
                      <div>
                        <Label>Total Balance (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newEvent.balance || ""}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              balance: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>APR (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={newEvent.apr || ""}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              apr: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="e.g., 19.9"
                        />
                      </div>
                      <div>
                        <Label>Minimum Payment (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newEvent.minimum_payment || ""}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              minimum_payment: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </>
                  )}

                  {/* Savings Goal specific fields */}
                  {newEvent.type === "savings" && (
                    <>
                      <div>
                        <Label>Target Amount (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newEvent.target_amount || ""}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              target_amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Target Date (Optional)</Label>
                        <Input
                          type="date"
                          value={newEvent.target_date || ""}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              target_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  {/* Payment Day (for income, fixed expenses, and debts) */}
                  {(newEvent.type === "income" || newEvent.type === "fixed" || newEvent.type === "debt") && (
                    <div>
                      <Label>Payment Day of Month</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={newEvent.payment_day || ""}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            payment_day: parseInt(e.target.value) || 1,
                          })
                        }
                        placeholder="1-31"
                      />
                    </div>
                  )}

                  {/* Frequency (for fixed expenses) */}
                  {newEvent.type === "fixed" && (
                    <div>
                      <Label>Frequency</Label>
                      <Select
                        value={newEvent.frequency}
                        onValueChange={(v) =>
                          setNewEvent({
                            ...newEvent,
                            frequency: v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={resetEventForm}>Cancel</AlertDialogCancel>
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
                    <Input
                      value={newIncome.description}
                      onChange={(e) =>
                        setNewIncome({
                          ...newIncome,
                          description: e.target.value,
                        })
                      }
                      placeholder="e.g. Freelance work, Bonus, Gift"
                    />
                  </div>
                  <div>
                    <Label>Amount (£)</Label>
                    <Input
                      type="number"
                      value={newIncome.amount || ""}
                      onChange={(e) =>
                        setNewIncome({
                          ...newIncome,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowIncomeModal(false);
                    }}
                  >
                    Close
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* ADD MONEY TO GOAL MODAL */}
            <AlertDialog
              open={!!addMoneyGoalId}
              onOpenChange={() => {
                setAddMoneyGoalId(null);
                setAddMoneyAmount(0);
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Add Money to Goal</AlertDialogTitle>
                  <AlertDialogDescription>How much would you like to add to this savings goal?</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Amount (£)</Label>
                    <Input
                      type="number"
                      value={addMoneyAmount || ""}
                      onChange={(e) => setAddMoneyAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAddMoney} disabled={addMoneyAmount <= 0}>
                    Add Money
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* EDIT GOAL AMOUNTS MODAL */}
            <AlertDialog open={!!editingGoalId} onOpenChange={() => setEditingGoalId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Edit Savings Goal</AlertDialogTitle>
                  <AlertDialogDescription>Update the saved and target amounts for this goal</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Current Amount Saved (£)</Label>
                    <Input
                      type="number"
                      value={editGoalData.current_amount || ""}
                      onChange={(e) =>
                        setEditGoalData({
                          ...editGoalData,
                          current_amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>Target Amount (£)</Label>
                    <Input
                      type="number"
                      value={editGoalData.target_amount || ""}
                      onChange={(e) =>
                        setEditGoalData({
                          ...editGoalData,
                          target_amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEditGoal}>Update</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* DELETE GOAL CONFIRMATION */}
            <AlertDialog open={!!deleteGoalId} onOpenChange={() => setDeleteGoalId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Savings Goal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this savings goal. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteGoalId && handleDeleteGoal(deleteGoalId)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* ADD TO EMERGENCY FUND DIALOG */}
            <AlertDialog open={showAddEmergencyFund} onOpenChange={setShowAddEmergencyFund}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Add to Emergency Fund</AlertDialogTitle>
                  <AlertDialogDescription>
                    Current emergency fund: {formatCurrency(savings?.emergency_fund || 0)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency-amount">Amount to Add (£)</Label>
                    <Input
                      id="emergency-amount"
                      type="number"
                      step="0.01"
                      value={emergencyFundAmount || ""}
                      onChange={(e) => setEmergencyFundAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      New total: {formatCurrency((savings?.emergency_fund || 0) + emergencyFundAmount)}
                    </p>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setEmergencyFundAmount(0)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAddEmergencyFund} disabled={emergencyFundAmount <= 0}>
                    Add Funds
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* EDIT EMERGENCY FUND DIALOG */}
            <AlertDialog open={showEditEmergencyFund} onOpenChange={setShowEditEmergencyFund}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Edit Emergency Fund</AlertDialogTitle>
                  <AlertDialogDescription>Update the current amount in your emergency fund</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-emergency-amount">Current Amount (£)</Label>
                    <Input
                      id="edit-emergency-amount"
                      type="number"
                      step="0.01"
                      value={editEmergencyFundAmount || ""}
                      onChange={(e) => setEditEmergencyFundAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Goal (3-6 months): {formatCurrency((totalFixed + totalVariable) * 3)} -{" "}
                      {formatCurrency((totalFixed + totalVariable) * 6)}
                    </p>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setEditEmergencyFundAmount(0)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEditEmergencyFund}>Update</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* TABS */}
            <TabsContent value="overview">{/* Main Status - Multi-Stage */}</TabsContent>

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
                  <VariableIncomeManager language={language} />
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
              <DebtPlanner
                language={language}
                monthlySavings={monthlySavings}
                setMonthlySavings={setMonthlySavings}
                debtMethod={debtMethod}
                setDebtMethod={setDebtMethod}
              />
            </TabsContent>

            <TabsContent value="savings">
              <div className="space-y-6">
                {/* Overall Savings Summary */}
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <PiggyBank className="h-6 w-6" />
                      Total Savings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      {formatCurrency(savingsTotal)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">Emergency Fund</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(savings?.emergency_fund || 0)}
                        </p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">Goals Saved</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(savingsGoalsData.reduce((s, g) => s + (g.current_amount || 0), 0))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Fund Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5 text-orange-500" />
                          Emergency Fund
                        </CardTitle>
                        <CardDescription>Build your safety net</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditEmergencyFundAmount(savings?.emergency_fund || 0);
                            setShowEditEmergencyFund(true);
                          }}
                          title="Edit emergency fund amount"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAddEmergencyFund(true)}
                          title="Add money to emergency fund"
                        >
                          <Wallet className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current</span>
                        <span className="font-bold">{formatCurrency(savings?.emergency_fund || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Goal (3-6 months expenses)</span>
                        <span className="font-bold text-orange-600">
                          {formatCurrency((totalFixed + totalVariable) * 3)} -{" "}
                          {formatCurrency((totalFixed + totalVariable) * 6)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(
                          100,
                          ((savings?.emergency_fund || 0) / ((totalFixed + totalVariable) * 3)) * 100,
                        )}
                        className="h-3"
                      />
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        {(savings?.emergency_fund || 0) >= (totalFixed + totalVariable) * 3
                          ? "✅ Emergency fund is healthy!"
                          : `💡 Save ${formatCurrency((totalFixed + totalVariable) * 3 - (savings?.emergency_fund || 0))} more to reach minimum goal`}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Savings Goals Manager */}
                <div className="mb-6">
                  <SavingsGoalsManager
                    language={language}
                    availableForSavings={Math.max(
                      0,
                      totalIncome -
                        totalExpenses -
                        savingsGoalsData
                          .filter((g) => g.is_active && g.monthly_contribution)
                          .reduce((s, g) => s + (g.monthly_contribution || 0), 0),
                    )}
                    availableBudget={Math.max(
                      0,
                      totalIncome -
                        totalExpenses -
                        savingsGoalsData
                          .filter((g) => g.is_active && g.monthly_contribution)
                          .reduce((s, g) => s + (g.monthly_contribution || 0), 0),
                    )}
                  />
                </div>
              </div>
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
const DebtPlanner = ({
  language,
  monthlySavings,
  setMonthlySavings,
  debtMethod,
  setDebtMethod,
}: {
  language: Language;
  monthlySavings: number;
  setMonthlySavings: (v: number) => void;
  debtMethod: DebtMethod;
  setDebtMethod: (v: DebtMethod) => void;
}) => {
  const t = translations[language];
  const { data: debtData = [] } = useDebts();
  const { data: incomeData = [] } = useIncomeSources();
  const { data: fixedExpensesData = [] } = useFixedExpenses();
  const { data: variableExpensesData = [] } = useVariableExpenses();
  const { data: savings } = useSavings();
  const { totalIncome, totalFixed, totalVariable, totalDebtPayment, totalExpenses, cashFlow, savingsTotal } =
    useMemo(() => {
      const totalIncome = incomeData.reduce((s, i) => s + i.amount, 0);
      const totalFixed = fixedExpensesData.reduce((s, e) => s + e.amount, 0);
      const totalVariable = variableExpensesData.reduce((s, e) => s + e.amount, 0);
      const totalDebtPayment = debtData.reduce((s, d) => s + d.minimum_payment, 0);
      const totalExpenses = totalFixed + totalVariable + totalDebtPayment;
      const cashFlow = totalIncome - totalExpenses;
      const savingsTotal = savings?.emergency_fund || 0;
      return {
        totalIncome,
        totalFixed,
        totalVariable,
        totalDebtPayment,
        totalExpenses,
        cashFlow,
        savingsTotal,
      };
    }, [incomeData, debtData, fixedExpensesData, variableExpensesData, savings]);
  const debtStrategy = useMemo(() => {
    if (debtData.length === 0) return null;
    const extraForDebt = Math.max(0, cashFlow - monthlySavings);
    const sortFn =
      debtMethod === "avalanche"
        ? (a, b) => b.apr - a.apr
        : debtMethod === "snowball"
          ? (a, b) => a.balance - b.balance
          : (a, b) => b.apr * 0.6 + (b.balance / 1000) * 0.4 - (a.apr * 0.6 + (a.balance / 1000) * 0.4);
    const sortedDebts = [...debtData].sort(sortFn);
    let remainingBalances = sortedDebts.map((d) => ({
      ...d,
      balance: d.balance,
    }));
    let months = 0;
    let totalInterest = 0;
    let allocation = sortedDebts.map((d) => ({
      name: d.name,
      minPayment: d.minimum_payment,
      extra: 0,
      totalPayment: d.minimum_payment,
    }));
    while (remainingBalances.some((d) => d.balance > 0) && months < 120) {
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
    const monthsToEmergency =
      monthlySavings > 0 ? ((totalExpenses * 3 - savingsTotal) / monthlySavings).toFixed(1) : "N/A";
    return {
      sortedDebts,
      allocation,
      months,
      totalInterest: Math.round(totalInterest),
      monthsToEmergency,
      extraForDebt,
    };
  }, [debtData, cashFlow, monthlySavings, debtMethod, totalExpenses, savingsTotal]);
  if (!debtStrategy)
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.debtPlanner}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">No debts to plan</p>
        </CardContent>
      </Card>
    );
  return (
    <div className="space-y-6">
      <Card></Card>

      <Card></Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t.priority}</span>
            <Select value={debtMethod} onValueChange={(value) => setDebtMethod(value as DebtMethod)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avalanche">
                  <Zap className="mr-2 h-4 w-4" /> {t.avalanche}
                </SelectItem>
                <SelectItem value="snowball">
                  <Snowflake className="mr-2 h-4 w-4" /> {t.snowball}
                </SelectItem>
                <SelectItem value="hybrid">
                  <Zap className="mr-2 h-4 w-4" /> {t.hybrid}
                </SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        {/* Debt Strategy - Improved Table with Projections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg font-semibold">Debt Priority Order</span>
              <Select value={debtMethod} onValueChange={(value) => setDebtMethod(value as DebtMethod)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avalanche">
                    <Zap className="mr-2 h-4 w-4" /> Avalanche (High APR First)
                  </SelectItem>
                  <SelectItem value="snowball">
                    <Snowflake className="mr-2 h-4 w-4" /> Snowball (Smallest Balance First)
                  </SelectItem>
                  <SelectItem value="hybrid">
                    <Zap className="mr-2 h-4 w-4" /> Hybrid (APR + Balance)
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
            <CardDescription className="text-sm">
              Prioritized debts with projected payoff times and interest saved
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Priority</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Debt Name
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">APR</th>
                    <th className="text-right p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Balance</th>
                    <th className="text-right p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Min Payment
                    </th>
                    <th className="text-right p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Extra</th>
                    <th className="text-right p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Total Payment
                    </th>
                    <th className="text-right p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Payoff Months
                    </th>
                    <th className="text-right p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Interest Saved
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {debtStrategy.sortedDebts.map((debt, index) => {
                    // Sophisticated data: Calculate individual payoff time and interest saved
                    const extraForThisDebt = index === 0 ? debtStrategy.extraForDebt : 0;
                    const totalPayment = debt.minimum_payment + extraForThisDebt;
                    const monthsForDebt = Math.ceil(debt.balance / totalPayment);
                    const interestSaved = Math.round(debt.balance * (debt.apr / 100 / 12) * monthsForDebt * 0.3); // 30% savings estimate

                    return (
                      <tr
                        key={debt.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index === 0 ? "bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500" : ""}`}
                      >
                        <td className="p-4">
                          <Badge
                            variant="secondary"
                            className={`w-8 h-8 flex items-center justify-center font-bold ${index === 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}`}
                          >
                            {index + 1}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{debt.name}</p>
                            {debt.bank && <p className="text-xs text-slate-500 dark:text-slate-400">{debt.bank}</p>}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-red-600">
                            {debt.apr}%
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold">{formatCurrency(debt.balance)}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {formatCurrency(debt.minimum_payment)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Badge
                            variant={extraForThisDebt > 0 ? "default" : "secondary"}
                            className={`${
                              extraForThisDebt > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {extraForThisDebt > 0 ? formatCurrency(extraForThisDebt) : "-"}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-indigo-600">
                            {formatCurrency(debt.minimum_payment + extraForThisDebt)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Badge
                            variant="outline"
                            className={
                              monthsForDebt < 6
                                ? "bg-green-100 text-green-800"
                                : monthsForDebt < 12
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {monthsForDebt} mo
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-medium text-green-600">{formatCurrency(interestSaved)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t font-semibold">
                  <tr>
                    <td colSpan={5} className="p-4 text-right">
                      Totals
                    </td>
                    <td className="p-4 text-right">{formatCurrency(debtStrategy.extraForDebt)}</td>
                    <td className="p-4 text-right">{formatCurrency(debtStrategy.extraForDebt + totalDebtPayment)}</td>
                    <td colSpan={2} className="p-4 text-right text-lg text-green-600">
                      Debt Free in {debtStrategy.months} {t.months} | Saved {formatCurrency(debtStrategy.totalInterest)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </Card>
    </div>
  );
};
export default Index;
