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
} from "date-fns";
import { formatCurrency, getCurrencySymbol, getTranslation } from "@/lib/i18n";
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
  Settings as SettingsIcon,
  Users,
  History,
} from "lucide-react";
import {
  useIncomeSources,
  useVariableIncome,
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
import { useMonthlyVariableIncomeTotal } from "@/hooks/useMonthlyVariableIncome";
import { useMonthlyVariableExpensesTotal } from "@/hooks/useMonthlyVariableExpenses";
import { toast } from "@/hooks/use-toast";
import { useFinancialProfiles } from "@/hooks/useFinancialProfiles";
import { Auth } from "@/components/Auth";
import { GuestModeBanner } from "@/components/GuestModeBanner";
import { hasPendingMigration, isGuestMode } from "@/lib/guest/store";
import { migrateGuestData } from "@/lib/guest/migrate";

import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesTracker } from "@/components/FixedExpensesTracker";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
import { MonthlyVariableIncomeTracker } from "@/components/MonthlyVariableIncomeTracker";
import { VariableExpensesTracker } from "@/components/MonthlyVariableExpensesTracker";
import { CategoryBudgetsManager } from "@/components/CategoryBudgetsManager";
import { SavingsGoalsManager } from "@/components/SavingsGoalsManager";
import { MonthlyPaymentTracker } from "@/components/MonthlyPaymentTracker";
import { GeneralSavingsTracker } from "@/components/GeneralSavingsTracker";


import { MonthlyPaymentProposal } from "@/components/MonthlyPaymentProposal";
import { SimplifiedDebtPriority } from "@/components/SimplifiedDebtPriority";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { MobileMenu } from "@/components/MobileMenu";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SettingsTab } from "@/components/SettingsTab";
import { HouseholdManager } from "@/components/HouseholdManager";
import { InvitationsManager } from "@/components/InvitationsManager";
import { AuditLogViewer } from "@/components/AuditLogViewer";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { FloatingBudgetBuddy } from "@/components/FloatingBudgetBuddy";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { useTheme as useNextTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { buildCalendarEvents, type CalendarEvent } from "@/lib/calendarEvents";
import { OverviewSummaryCards } from "@/components/dashboard/OverviewSummaryCards";
import { ExpenseBreakdownCard } from "@/components/dashboard/ExpenseBreakdownCard";
import { PaymentTimelineCard } from "@/components/dashboard/PaymentTimelineCard";
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
import type { Language } from "@/lib/i18n";
import { sumMonthlyFixedExpenses } from "@/lib/budgetMath";
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
    settingsTitle: "Settings",
    settingsDescription: "Manage your currency, household invitations and change log",
    generalTab: "General",
    invitationsTab: "Invitations",
    auditTab: "Log",
    exportData: "Export Data",
    debtFreeDate: "Debt Free Date",
    paymentTimeline: "Payment Timeline - This Week",
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
    settingsTitle: "Configuración",
    settingsDescription: "Gestiona tu moneda, invitaciones al grupo familiar y registro de cambios",
    generalTab: "General",
    invitationsTab: "Invitaciones",
    auditTab: "Registro",
    exportData: "Exportar datos",
    debtFreeDate: "Fecha Libre de Deudas",
    paymentTimeline: "Calendario de Pagos - Esta Semana",
  },
  pt: {
    overview: "Visão Geral",
    income: "Rendimentos",
    expenses: "Despesas",
    debts: "Dívidas",
    debtPlanner: "Planejador de Dívidas",
    totalIncome: "Rendimento Total",
    totalExpenses: "Despesas Totais",
    cashFlow: "Fluxo de Caixa",
    totalSavings: "Poupanças Totais",
    healthy: "Saudável",
    review: "Revisar",
    fixedIncome: "Rendimento Fixo",
    variableIncome: "Rendimento Variável",
    fixedExpenses: "Despesas Fixas",
    variableExpenses: "Despesas Variáveis",
    noData: "Ainda não há dados",
    add: "Adicionar",
    description: "Descrição",
    strategy: "Estratégia de Pagamento de Dívidas",
    avalanche: "Avalanche (APR Alto Primeiro)",
    snowball: "Bola de Neve (Saldo Menor Primeiro)",
    hybrid: "Híbrido (APR + Saldo)",
    recommended: "Recomendado",
    months: "meses",
    totalInterest: "Total de Juros Economizado",
    priority: "Ordem de Prioridade de Dívidas",
    payFirst: "Pagar Primeiro",
    minPayment: "Pagamento Mínimo",
    monthlySavings: "Poupanças Mensais para Fundo de Emergência",
    emergencyFund: "Estimativa de Fundo de Emergência",
    cashFlowAfterSavings: "Fluxo de Caixa Após Poupanças",
    debtPayment: "Disponível para Pagamento de Dívida",
    monthsToEmergency: "Meses para Meta de Fundo de Emergência",
    monthlyDebtAllocation: "Alocação Mensal de Dívida",
    settingsTitle: "Configurações",
    settingsDescription: "Gerencie sua moeda, convites do lar e registro de alterações",
    generalTab: "Geral",
    invitationsTab: "Convites",
    auditTab: "Registro",
    exportData: "Exportar dados",
    debtFreeDate: "Data Livre de Dívidas",
    paymentTimeline: "Calendário de Pagamentos - Esta Semana",
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
  const { data: incomeData = [], isLoading: incomeLoading } = useIncomeSources();
  const { data: variableIncomeData = [] } = useVariableIncome();

  // Get current month's variable income and expenses totals
  const currencySymbol = getCurrencySymbol();
  const currentMonthStart = useMemo(() => startOfMonth(new Date()), []);
  const currentMonthVariableIncome = useMonthlyVariableIncomeTotal(currentMonthStart);
  const currentMonthVariableExpenses = useMonthlyVariableExpensesTotal(currentMonthStart);
  const { data: debtData = [], isLoading: debtsLoading } = useDebts();
  const { data: fixedExpensesData = [], isLoading: fixedLoading } = useFixedExpenses();
  const { data: variableExpensesData = [] } = useVariableExpenses();
  const { data: savingsGoalsData = [] } = useSavingsGoals();
  const { data: savings, isLoading: savingsLoading } = useSavings();
  const overviewLoading = incomeLoading || debtsLoading || fixedLoading || savingsLoading;

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [projectionMonthOffset, setProjectionMonthOffset] = useState(0); // New state for month projection

  const handlePrevWeek = () => {
    setCurrentWeekOffset((prev) => prev - 1);
  };
  const handleNextWeek = () => {
    setCurrentWeekOffset((prev) => prev + 1);
  };
  const handlePrevProjectionMonth = () => {
    setProjectionMonthOffset((prev) => prev - 1);
  };
  const handleNextProjectionMonth = () => {
    setProjectionMonthOffset((prev) => prev + 1);
  };

  // Mutation hooks for adding financial data
  const addIncomeMutation = useAddIncome();
  const addDebtMutation = useAddDebt();
  const addFixedExpenseMutation = useAddFixedExpense();
  const addVariableExpenseMutation = useAddVariableExpense();
  const addSavingsGoalMutation = useAddSavingsGoal();
  const t = translations[language];
  const {
    totalIncome,
    totalVariableIncome,
    totalFixed,
    totalVariable,
    totalDebtPayment,
    totalExpenses,
    cashFlow,
    savingsTotal,
    debtFreeDate,
    monthsToDebtFree,
    idealProgressPercent,
    idealRemainingDebt,
    projectionDate,
    pieData,
    calendarEvents,
    monthStart,
    monthEnd,
    monthDays,
    firstDayOfWeek,
    blankDays,
  } = useMemo(() => {
    const totalFixedIncome = incomeData.reduce((s, i) => s + i.amount, 0);

    // Use monthly variable income from database instead of calculated from recurring
    const totalVariableIncome = currentMonthVariableIncome;
    const totalIncome = totalFixedIncome + totalVariableIncome;
    // Fixed expenses: respect frequency_type/payment_month so quarterly,
    // semiannual and annual expenses are only counted in the months they are due,
    // and weekly/bi-weekly ones are converted to their monthly equivalent.
    const currentMonthNum = new Date().getMonth() + 1;
    const totalFixed = sumMonthlyFixedExpenses(fixedExpensesData, currentMonthNum);

    // Use monthly variable expenses from database instead of regular variable expenses
    const totalVariable = currentMonthVariableExpenses;
    const totalDebtPayment = debtData.reduce((s, d) => s + d.minimum_payment, 0);
    const totalExpenses = totalFixed + totalVariable + totalDebtPayment;

    // Calculate total active monthly contributions from savings goals
    const totalSavingsCommitments = savingsGoalsData
      .filter((g) => g.is_active && g.monthly_contribution)
      .reduce((s, g) => s + (g.monthly_contribution || 0), 0);

    // Deduct savings commitments from cashflow
    const grossCashFlow = totalIncome - totalExpenses;
    const cashFlow = grossCashFlow - totalSavingsCommitments;

    // Calculate total savings including emergency fund, general savings, and goals
    const savingsTotal =
      (savings?.emergency_fund || 0) +
      (savings?.total_accumulated || 0) +
      savingsGoalsData.reduce((s, g) => s + (g.current_amount || 0), 0);

    // Calculate debt projection based on offset using the same amortization logic
    const projectionDate = addMonths(new Date(), projectionMonthOffset);
    const projectionMonths = Math.max(0, projectionMonthOffset);
    let remaining = debtData.reduce((s, d) => s + d.balance, 0);
    let months = 0;

    // NO aplicar automáticamente el excedente del cashflow a las deudas
    // Solo usar los pagos mínimos para el cálculo
    const monthlyPay = totalDebtPayment;
    const totalDebt = debtData.reduce((s, d) => s + d.balance, 0);

    const buildSimDebts = () => debtData.map(d => ({
      balance: d.balance,
      apr: d.apr,
      minPay: d.minimum_payment,
    }));

    const applyDebtMonth = (simDebts: Array<{ balance: number; apr: number; minPay: number }>) => {
      let extraAvailable = Math.max(
        0,
        monthlyPay - simDebts.reduce((s, d) => s + (d.balance > 0 ? d.minPay : 0), 0)
      );

      simDebts.forEach(d => {
        if (d.balance <= 0) return;
        const interest = d.balance * (d.apr / 100 / 12);
        const payment = Math.min(d.balance + interest, d.minPay);
        d.balance = d.balance + interest - payment;
        if (d.balance < 0.01) d.balance = 0;
      });

      const sorted = [...simDebts].sort((a, b) => b.apr - a.apr);
      for (const d of sorted) {
        if (d.balance > 0 && extraAvailable > 0) {
          const extra = Math.min(extraAvailable, d.balance);
          d.balance -= extra;
          extraAvailable -= extra;
          if (d.balance < 0.01) d.balance = 0;
        }
      }

      return simDebts.reduce((s, d) => s + d.balance, 0);
    };

    const projectedDebts = buildSimDebts();
    for (let i = 0; i < projectionMonths && projectedDebts.some(d => d.balance > 0); i++) {
      applyDebtMonth(projectedDebts);
    }

    const idealRemainingDebt = projectedDebts.reduce((s, d) => s + d.balance, 0);
    const idealProgressPercent =
      totalDebt > 0 ? Math.min(100, ((totalDebt - idealRemainingDebt) / totalDebt) * 100) : 0;

    // Calculate actual debt free months
    const simDebts = buildSimDebts();
    while (simDebts.some(d => d.balance > 0) && months < 360) {
      months++;
      remaining = applyDebtMonth(simDebts);
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

    // Recurring calendar events for the surrounding years (pure helper).
    const allEvents: CalendarEvent[] = buildCalendarEvents({
      incomeData,
      variableIncomeData,
      fixedExpensesData,
      debtData,
      variableExpensesData,
      startYear: currentMonth.getFullYear() - 1,
      endYear: currentMonth.getFullYear() + 1,
    });
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
      totalVariableIncome,
      totalFixed,
      totalVariable,
      totalDebtPayment,
      totalExpenses,
      cashFlow,
      savingsTotal,
      debtFreeDate,
      monthsToDebtFree,
      idealProgressPercent,
      idealRemainingDebt,
      projectionDate,
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
    currentMonthVariableIncome,
    currentMonthVariableExpenses,
    fixedExpensesData,
    variableExpensesData,
    debtData,
    savings,
    savingsGoalsData,
    currentMonth,
    monthlySavings,
    projectionMonthOffset,
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

  // Move locally stored demo data into the account right after signing up/in.
  useEffect(() => {
    if (!user || isGuestMode() || !hasPendingMigration()) return;
    let cancelled = false;
    migrateGuestData()
      .then(({ migrated }) => {
        if (cancelled || migrated === 0) return;
        queryClient.invalidateQueries();
        toast({ title: getTranslation(language, "guestModeMigrated") });
      })
      .catch(() => {
        /* keep the local data so the user can retry */
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

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
      // Cap the goal balance at its target so progress never exceeds 100%
      const newAmount = Math.min(
        goal.current_amount + addMoneyAmount,
        goal.target_amount || goal.current_amount + addMoneyAmount,
      );
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

      // Include variable income in AI context
      const contextPrompt = `
        Monthly Income: ${formatCurrency(totalIncome)}
        Variable Income: ${formatCurrency(currentMonthVariableIncome)}
        Total Expenses: ${formatCurrency(totalExpenses)}
        Cash Flow: ${formatCurrency(cashFlow)}
      `;
      if (lower.includes("save")) {
        response = `Cut £50-100 from variable expenses (£${totalVariable}).`;
      } else if (lower.includes("debt")) {
        response = `Pay highest APR first. Debt-free in ${monthsToDebtFree} ${monthsToDebtFree === 1 ? 'month' : 'months'}.`;
      } else if (lower.includes("variable income") || lower.includes("extra income")) {
        const variableAllocation = currentMonthVariableIncome * 0.2;
        response = `You have ${formatCurrency(currentMonthVariableIncome)} in variable income this month. Suggestion: Allocate 20% (${formatCurrency(variableAllocation)}) to debt payoff.`;
      } else {
        response = `Track every expense for 30 days.`;
      }
      setAiResponse(`${contextPrompt}\n\n${response}`);
      setAiLoading(false);
    }, 800);
  };
  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      
      <OnboardingGuide language={language} onComplete={() => {}} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <ScrollToTop />
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {isGuestMode() && <GuestModeBanner language={language} />}

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
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="transition-all duration-200"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" title={t.settingsTitle}>
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{t.settingsTitle}</SheetTitle>
                    <SheetDescription>
                      {t.settingsDescription}
                    </SheetDescription>
                  </SheetHeader>
                  <Tabs defaultValue="settings" className="mt-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="settings">{t.generalTab}</TabsTrigger>
                      <TabsTrigger value="invitations">{t.invitationsTab}</TabsTrigger>
                      <TabsTrigger value="audit">{t.auditTab}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="settings" className="mt-4">
                      <SettingsTab language={language} />
                      <div className="mt-6 pt-6 border-t">
                        <Button variant="outline" onClick={() => window.print()} className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          {t.exportData}
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="invitations" className="mt-4">
                      <InvitationsManager language={language} />
                    </TabsContent>
                    <TabsContent value="audit" className="mt-4">
                      <AuditLogViewer language={language} />
                    </TabsContent>
                  </Tabs>
                </SheetContent>
              </Sheet>
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
              {
                value: "settings",
                label: "Settings",
                icon: <SettingsIcon className="h-5 w-5" />,
              },
              {
                value: "household",
                label: "Household",
                icon: <Users className="h-5 w-5" />,
              },
              {
                value: "history",
                label: "History",
                icon: <History className="h-5 w-5" />,
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

            <TabsContent value="overview" className="space-y-10">
              {/* 1. KEY METRICS — first thing the user sees */}
              {overviewLoading ? (
                <SummaryCardsSkeleton />
              ) : (
                <OverviewSummaryCards
                  totalIncome={totalIncome}
                  totalVariableIncome={totalVariableIncome}
                  totalExpenses={totalExpenses}
                  cashFlow={cashFlow}
                  savingsTotal={savingsTotal}
                  emergencyFund={savings?.emergency_fund || 0}
                  generalSavings={savings?.total_accumulated || 0}
                  goalsSaved={savingsGoalsData.reduce((s, g) => s + (g.current_amount || 0), 0)}
                  labels={{
                    totalIncome: t.totalIncome,
                    totalExpenses: t.totalExpenses,
                    cashFlow: t.cashFlow,
                    totalSavings: t.totalSavings,
                    variable: language === "en" ? "Variable" : "Variable",
                    emergency: language === "en" ? "Emergency" : language === "es" ? "Emergencia" : "Emergência",
                    general: language === "en" ? "General" : "General",
                    goals: language === "en" ? "Goals" : language === "es" ? "Metas" : "Metas",
                  }}
                />
              )}

              {/* 2. SPENDING CHART — visual centre of the tab */}
              {overviewLoading ? (
                <ChartCardSkeleton />
              ) : (
                <ExpenseBreakdownCard
                  pieData={pieData}
                  totalExpenses={totalExpenses}
                  totalIncome={totalIncome}
                  labels={{
                    title: language === "en" ? "Expense Breakdown" : language === "es" ? "Desglose de Gastos" : "Detalhamento de Despesas",
                    subtitle:
                      language === "en"
                        ? "Monthly spending distribution with trends"
                        : language === "es"
                          ? "Distribución del gasto mensual con tendencias"
                          : "Distribuição dos gastos mensais com tendências",
                    monthlyTotal: language === "en" ? "Monthly Total" : language === "es" ? "Total Mensual" : "Total Mensal",
                    monthly: language === "en" ? "Monthly" : language === "es" ? "Mensual" : "Mensal",
                    ofIncome: language === "en" ? "of income" : language === "es" ? "de los ingresos" : "das receitas",
                    high: language === "en" ? "High" : language === "es" ? "Alto" : "Alto",
                    medium: language === "en" ? "Medium" : language === "es" ? "Medio" : "Médio",
                    low: language === "en" ? "Low" : language === "es" ? "Bajo" : "Baixo",
                    impact: language === "en" ? "impact" : language === "es" ? "impacto" : "impacto",
                  }}
                />
              )}

              {/* 3. SECONDARY SECTION — debt horizon + week ahead, lower emphasis */}
              <section className="space-y-4 pt-2">
                <h2 className="text-label text-muted-foreground">
                  {language === "en" ? "Planning" : language === "es" ? "Planificación" : "Planejamento"}
                </h2>

                {overviewLoading ? (
                  <ListCardSkeleton rows={2} />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {debtData.length > 0 && (
                      <Card className="animate-fade-in">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-subtitle flex items-center gap-2 text-muted-foreground">
                              <TrendingUp className="h-4 w-4" aria-hidden="true" /> {t.debtFreeDate}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handlePrevProjectionMonth}
                                aria-label={language === "en" ? "Previous month" : language === "es" ? "Mes anterior" : "Mês anterior"}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <span className="text-body-sm font-medium min-w-[70px] text-center tabular-nums">
                                {projectionMonthOffset === 0
                                  ? "Current"
                                  : projectionMonthOffset > 0
                                    ? `+${projectionMonthOffset}m`
                                    : `${projectionMonthOffset}m`}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleNextProjectionMonth}
                                aria-label={language === "en" ? "Next month" : language === "es" ? "Mes siguiente" : "Próximo mês"}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-metric">{format(debtFreeDate, "d MMM yyyy")}</p>
                            <p className="text-body text-muted-foreground">{monthsToDebtFree} {monthsToDebtFree === 1 ? (language === 'en' ? 'month' : language === 'es' ? 'mes' : 'mês') : (language === 'en' ? 'months' : 'meses')} {language === 'en' ? 'away' : language === 'es' ? 'restantes' : 'restantes'}</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-body-sm">
                              <span className="text-muted-foreground">Ideal Progress</span>
                              <span className="font-semibold tabular-nums">{idealProgressPercent.toFixed(1)}%</span>
                            </div>
                            <Progress value={idealProgressPercent} className="h-2" aria-label="Ideal progress" />
                            <p className="text-body-sm text-muted-foreground">
                              Ideal Remaining Debt: {formatCurrency(idealRemainingDebt)}
                            </p>
                            {projectionMonthOffset !== 0 && (
                              <p className="text-body-sm text-primary font-medium">
                                Projection for {format(projectionDate, "MMM yyyy")}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <PaymentTimelineCard
                      title={t.paymentTimeline}
                      events={calendarEvents}
                      weekOffset={currentWeekOffset}
                      onPrevWeek={handlePrevWeek}
                      onNextWeek={handleNextWeek}
                      labels={{
                        previous: language === "en" ? "Previous" : language === "es" ? "Anterior" : "Anterior",
                        next: language === "en" ? "Next" : language === "es" ? "Siguiente" : "Próximo",
                        empty:
                          language === "en"
                            ? "No upcoming payments this week"
                            : language === "es"
                              ? "No hay pagos próximos esta semana"
                              : "Nenhum pagamento próximo esta semana",
                        paid: language === "en" ? "Paid" : language === "es" ? "Pagado" : "Pago",
                        today: language === "en" ? "Today" : language === "es" ? "Hoy" : "Hoje",
                        recurring: language === "en" ? "Recurring" : language === "es" ? "Recurrente" : "Recorrente",
                      }}
                    />
                  </div>
                )}
              </section>
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
                      <Label>{newEvent.type === "savings" ? `Current Saved Amount (${currencySymbol})` : `Amount (${currencySymbol})`}</Label>
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
                        <Label>Total Balance ({currencySymbol})</Label>
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
                        <Label>Minimum Payment ({currencySymbol})</Label>
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
                        <Label>Target Amount ({currencySymbol})</Label>
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
                    <Label>Amount ({currencySymbol})</Label>
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
                    <Label>Amount ({currencySymbol})</Label>
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
                    <Label>Current Amount Saved ({currencySymbol})</Label>
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
                    <Label>Target Amount ({currencySymbol})</Label>
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
                    <Label htmlFor="emergency-amount">Amount to Add ({currencySymbol})</Label>
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
                    <Label htmlFor="edit-emergency-amount">Current Amount ({currencySymbol})</Label>
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
                  <MonthlyVariableIncomeTracker language={language} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="expenses">
              <Tabs defaultValue="fixed" className="mt-6">
                <TabsList>
                  <TabsTrigger value="fixed">Fixed</TabsTrigger>
                  <TabsTrigger value="variable">Variable</TabsTrigger>
                  <TabsTrigger value="budgets">Budgets</TabsTrigger>
                </TabsList>
                <TabsContent value="fixed">
                  <FixedExpensesTracker language={language} />
                </TabsContent>
                <TabsContent value="variable">
                  <VariableExpensesTracker language={language} />
                </TabsContent>
                <TabsContent value="budgets">
                  <CategoryBudgetsManager language={language} />
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">Emergency Fund</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(savings?.emergency_fund || 0)}
                        </p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">General Savings</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(savings?.total_accumulated || 0)}
                        </p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">Goals Saved</p>
                        <p className="text-xl font-bold text-purple-600">
                          {formatCurrency(savingsGoalsData.reduce((s, g) => s + (g.current_amount || 0), 0))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Payment Tracker */}
                <MonthlyPaymentTracker language={language} />

                {/* General Savings Tracker */}
                <GeneralSavingsTracker language={language} />

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

            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>

            <TabsContent value="household">
              <div className="space-y-6">
                <HouseholdManager language={language} />
                <InvitationsManager language={language} />
              </div>
            </TabsContent>

            <TabsContent value="history">
              <AuditLogViewer />
            </TabsContent>
          </Tabs>

          <footer className="no-print py-8 text-center text-xs text-muted-foreground border-t mt-12">
            <p className="font-semibold mb-2">Legal Disclaimer (UK)</p>
            <p>This app is for educational use only. Not financial advice. Consult an FCA adviser.</p>
            <p className="mt-2">© 2025 Family Budget Planner UK</p>
          </footer>
        </div>
        <FloatingChatWidget language={language} />
        <FloatingBudgetBuddy 
          language={language} 
          profileId={"id" in activeProfile ? activeProfile.id : undefined}
        />
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
  const currentMonthVariableExpenses = useMonthlyVariableExpensesTotal(startOfMonth(new Date()));
  const { data: savings } = useSavings();
  const { data: savingsGoalsData = [] } = useSavingsGoals();
  const { totalIncome, totalFixed, totalVariable, totalDebtPayment, totalExpenses, cashFlow, savingsTotal } =
    useMemo(() => {
      // Same rules as the Overview tab so both tabs never disagree.
      const currentMonthNum = new Date().getMonth() + 1;
      const totalIncome = incomeData.reduce((s, i) => s + i.amount, 0);
      const totalFixed = sumMonthlyFixedExpenses(fixedExpensesData, currentMonthNum);
      const totalVariable = currentMonthVariableExpenses;
      const activeDebts = debtData.filter((d) => d.balance > 0 && d.minimum_payment > 0);
      const totalDebtPayment = activeDebts.reduce((s, d) => s + d.minimum_payment, 0);
      const totalExpenses = totalFixed + totalVariable + totalDebtPayment;
      const savingsCommitments = savingsGoalsData
        .filter((g) => g.is_active && g.monthly_contribution)
        .reduce((s, g) => s + (g.monthly_contribution || 0), 0);
      const cashFlow = totalIncome - totalExpenses - savingsCommitments;
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
    }, [incomeData, debtData, fixedExpensesData, currentMonthVariableExpenses, savings, savingsGoalsData]);
  // Only the ordering is used here; the real amortization (with surplus and freed-up
  // minimums redistributed) lives in SimplifiedDebtPriority, so no second engine.
  const debtStrategy = useMemo(() => {
    const activeDebts = debtData.filter((d) => d.balance > 0 && d.minimum_payment > 0);
    if (activeDebts.length === 0) return null;

    const sortFn =
      debtMethod === "avalanche"
        ? (a, b) => b.apr - a.apr
        : debtMethod === "snowball"
          ? (a, b) => a.balance - b.balance
          : (a, b) => b.apr * 0.6 + (b.balance / 1000) * 0.4 - (a.apr * 0.6 + (a.balance / 1000) * 0.4);

    return { sortedDebts: [...activeDebts].sort(sortFn) };
  }, [debtData, debtMethod]);
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
      {/* Monthly Payment Proposal */}
      <MonthlyPaymentProposal
        cashFlow={cashFlow}
        monthlySavings={monthlySavings}
        totalFixed={totalFixed}
        totalVariable={totalVariable}
        debts={debtData.filter((d) => d.balance > 0)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">{language === 'en' ? 'Debt Priority Order' : language === 'es' ? 'Orden de Prioridad de Deudas' : 'Ordem de Prioridade de Dívidas'}</span>
            <Select value={debtMethod} onValueChange={(value) => setDebtMethod(value as DebtMethod)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avalanche">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Avalanche (High APR First)
                  </div>
                </SelectItem>
                <SelectItem value="snowball">
                  <div className="flex items-center gap-2">
                    <Snowflake className="h-4 w-4" /> Snowball (Smallest Balance First)
                  </div>
                </SelectItem>
                <SelectItem value="hybrid">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Hybrid (APR + Balance)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
           <CardDescription className="text-sm">
            {language === 'en' ? 'Debt repayment plan with surplus allocation based on your chosen strategy' : language === 'es' ? 'Plan de pago de deudas con asignación de excedente según tu estrategia elegida' : 'Plano de pagamento de dívidas com alocação de excedente baseada na sua estratégia escolhida'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimplifiedDebtPriority debts={debtStrategy.sortedDebts} method={debtMethod} language={language} cashFlow={cashFlow} monthlySavings={monthlySavings} />
        </CardContent>
      </Card>
    </div>
  );
};
export default Index;
