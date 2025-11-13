import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Receipt,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  usePaymentTracker,
  useAddPaymentTracker,
  useUpdatePaymentTracker,
  useDeletePaymentTracker,
  useAllPaymentHistory,
  type PaymentTrackerEntry,
  type NewPaymentTrackerEntry,
} from "@/hooks/usePaymentTracker";
import { useIncomeSources, useDebts, useFixedExpenses, useSavingsGoals } from "@/hooks/useFinancialData";
import { useFinancialProfiles, useActiveProfile } from "@/hooks/useFinancialProfiles";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/i18n";
import { format, startOfMonth, addMonths, subMonths, isPast, isToday, differenceInMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { AutoPaymentsGenerator } from "@/components/AutoPaymentsGenerator";

interface PaymentEntry {
  id: string;
  month_year: string;
  payment_type: "income" | "expense" | "debt" | "savings";
  amount: number;
  payment_status: "pending" | "paid" | "partial";
  payment_date: string;
  notes?: string;
  source_id?: string;
  is_manual?: boolean;
}

interface MonthlyPaymentTrackerProps {
  language: Language;
}

export const MonthlyPaymentTracker = ({ language }: MonthlyPaymentTrackerProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PaymentTrackerEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "type" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "debt" | "savings">("all");

  const [formData, setFormData] = useState({
    payment_type: "expense" as "income" | "expense" | "debt" | "savings",
    amount: "",
    payment_status: "pending" as "pending" | "paid" | "partial",
    payment_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    source_id: "",
  });

  const { toast } = useToast();
  const { data: activeProfile } = useActiveProfile();
  const { data: payments = [] } = usePaymentTracker(currentMonth);
  const { data: allPayments = [] } = useAllPaymentHistory();
  const { data: incomes = [] } = useIncomeSources();
  const { data: debts = [] } = useDebts();
  const { data: expenses = [] } = useFixedExpenses();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const addMutation = useAddPaymentTracker();
  const updateMutation = useUpdatePaymentTracker();
  const deleteMutation = useDeletePaymentTracker();

  const t = {
    en: {
      title: "Monthly Payment Tracker",
      description: "Track what you've paid this month",
      addPayment: "Add Payment",
      editPayment: "Edit Payment",
      selectDebt: "Select Debt",
      amount: "Amount",
      date: "Date",
      notes: "Notes",
      noPayments: "No payments tracked this month",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      search: "Search payments",
      sort: "Sort by",
      filter: "Filter by type",
      all: "All",
      totalPaid: "Total Paid",
      totalPending: "Total Pending",
      trend: "Trend",
      monthlyTrend: "Monthly Trend",
      noTrendData: "No trend data available",
      confirmDelete: "Are you sure you want to delete this payment?",
      extraPaid: "Extra Paid",
      totalDebtBalance: "Total Debt Balance",
      expectedThisMonth: "Expected This Month",
    },
    es: {
      title: "Seguimiento de Pagos Mensuales",
      description: "Rastrea lo que has pagado este mes",
      addPayment: "Añadir Pago",
      editPayment: "Editar Pago",
      selectDebt: "Seleccionar Deuda",
      amount: "Monto",
      date: "Fecha",
      notes: "Notas",
      noPayments: "No hay pagos registrados este mes",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      search: "Buscar pagos",
      sort: "Ordenar por",
      filter: "Filtrar por tipo",
      all: "Todos",
      totalPaid: "Total Pagado",
      totalPending: "Total Pendiente",
      trend: "Tendencia",
      monthlyTrend: "Tendencia Mensual",
      noTrendData: "No hay datos de tendencia disponibles",
      confirmDelete: "¿Estás seguro de que quieres eliminar este pago?",
      extraPaid: "Extra Pagado",
      totalDebtBalance: "Balance Total de Deudas",
      expectedThisMonth: "Esperado Este Mes",
    },
    pl: {
      title: "Miesięczny Tracker Płatności",
      description: "Śledź, co zapłaciłeś w tym miesiącu",
      addPayment: "Dodaj Płatność",
      editPayment: "Edytuj Płatność",
      selectDebt: "Wybierz Dług",
      amount: "Kwota",
      date: "Data",
      notes: "Notatki",
      noPayments: "Brak płatności w tym miesiącu",
      save: "Zapisz",
      cancel: "Anuluj",
      delete: "Usuń",
      edit: "Edytuj",
      search: "Szukaj płatności",
      sort: "Sortuj według",
      filter: "Filtruj według typu",
      all: "Wszystkie",
      totalPaid: "Razem Zapłacone",
      totalPending: "Razem Oczekujące",
      trend: "Trend",
      monthlyTrend: "Miesięczny Trend",
      noTrendData: "Brak danych trendu",
      confirmDelete: "Czy na pewno chcesz usunąć tę płatność?",
      extraPaid: "Dodatkowe Płatności",
      totalDebtBalance: "Całkowite Saldo Długów",
      expectedThisMonth: "Oczekiwane W Tym Miesiącu",
    },
  }[language];

  // Sorting and filtering
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];
    if (filterType !== "all") filtered = filtered.filter((p) => p.payment_type === filterType);
    if (searchQuery)
      filtered = filtered.filter(
        (p) =>
          (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.source_id && p.source_id.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    if (sortBy === "amount") filtered.sort((a, b) => (sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount));
    if (sortBy === "date")
      filtered.sort((a, b) =>
        sortOrder === "asc"
          ? new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
          : new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
      );
    if (sortBy === "type")
      filtered.sort((a, b) =>
        sortOrder === "asc"
          ? a.payment_type.localeCompare(b.payment_type)
          : b.payment_type.localeCompare(a.payment_type),
      );
    if (sortBy === "status")
      filtered.sort((a, b) =>
        sortOrder === "asc"
          ? a.payment_status.localeCompare(b.payment_status)
          : b.payment_status.localeCompare(a.payment_status),
      );
    return filtered;
  }, [payments, searchQuery, sortBy, sortOrder, filterType]);

  // Sophisticated data: Monthly totals, trend
  const monthlyTotals = useMemo(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(currentMonth);
    const currentMonthEnd = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0);
    const todayMonthStart = startOfMonth(today);
    const isCurrentMonth = currentMonthStart.getTime() === todayMonthStart.getTime();
    const isFutureMonth = currentMonthStart > todayMonthStart;
    const isPastMonth = currentMonthStart < todayMonthStart;
    // Total paid this specific month - include payments with payment_date <= today OR status = "paid"
    const totalPaidThisMonth = payments
      .filter((p) => {
        const paymentDate = p.payment_date ? new Date(p.payment_date) : null;
        return (
          p.payment_status === "paid" ||
          (paymentDate && paymentDate <= today && paymentDate >= currentMonthStart && paymentDate <= currentMonthEnd)
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);
    // Expected payments this month (sum of minimum_payment for active debts)
    const expectedThisMonth = debts
      .filter((d) => d.balance > 0 && d.minimum_payment > 0)
      .reduce((sum, d) => sum + d.minimum_payment, 0);
    // Calculate extra paid (amount above minimum payments)
    const extraPaid = payments
      .filter((p) => {
        const paymentDate = p.payment_date ? new Date(p.payment_date) : null;
        return (
          p.payment_status === "paid" ||
          (paymentDate && paymentDate <= today && paymentDate >= currentMonthStart && paymentDate <= currentMonthEnd)
        );
      })
      .reduce((sum, p) => {
        const debt = debts.find((d) => d.id === p.source_id);
        if (!debt) return sum;
        const extraAmount = Math.max(0, p.amount - debt.minimum_payment);
        return sum + extraAmount;
      }, 0);
    // CRITICAL: Calculate projected total debt balance based on viewing month
    const totalDebtBalance = debts.reduce((sum, debt) => {
      let projectedBalance = debt.balance; // Current real balance (reflects paid payments)
      if (isFutureMonth) {
        // FUTURE: Subtract ALL scheduled payments from current month UP TO AND INCLUDING viewing month
        // This projects how much the debt will be reduced by that future month
        const paymentsUntilViewingMonth = allPayments.filter((p) => {
          if (p.source_id !== debt.id) return false;
          const pMonthStr = p.month_year;
          const pMonth = new Date(pMonthStr);
          // Include current month and all months up to the viewing month
          return pMonth >= todayMonthStart && pMonth <= currentMonthStart;
        });
        const totalToDeduct = paymentsUntilViewingMonth.reduce((acc, p) => acc + p.amount, 0);
        projectedBalance = Math.max(0, debt.balance - totalToDeduct);
      } else if (isPastMonth) {
        // PAST: Add back all payments made AFTER the viewing month up to current month
        // This reconstructs what the balance was in that past month
        const paymentsAfterViewingMonth = allPayments.filter((p) => {
          if (p.source_id !== debt.id) return false;
          const pMonthStr = p.month_year;
          const pMonth = new Date(pMonthStr);
          // Include all months AFTER viewing month up to and including current month
          return pMonth > currentMonthStart && pMonth <= todayMonthStart;
        });
        const totalToRestore = paymentsAfterViewingMonth.reduce((acc, p) => acc + p.amount, 0);
        projectedBalance = debt.balance + totalToRestore;
      } else {
        // CURRENT MONTH: Use current balance as-is (already reflects all paid payments)
        projectedBalance = debt.balance;
      }
      return sum + Math.max(0, projectedBalance);
    }, 0);
    return {
      totalPaidThisMonth,
      expectedThisMonth,
      totalDebtBalance,
      extraPaid,
    };
  }, [payments, allPayments, debts, currentMonth]);
  const handleSave = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.source_id) {
      toast({
        title: "Error",
        description: "Please select a debt.",
        variant: "destructive",
      });
      return;
    }
    const entry: NewPaymentTrackerEntry & { profile_id?: string | null } = {
      month_year: format(startOfMonth(currentMonth), "yyyy-MM-dd"),
      payment_type: "debt",
      amount: parseFloat(formData.amount),
      payment_status: "paid",
      payment_date: formData.payment_date,
      notes: formData.notes || undefined,
      source_id: formData.source_id,
      source_table: "debts",
      profile_id: activeProfile?.id || null,
    };
    if (editingEntry) {
      updateMutation.mutate(
        { id: editingEntry.id, ...entry },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Payment updated successfully.",
            });
            setIsAddDialogOpen(false);
            resetForm();
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: error.message || "Failed to update payment.",
              variant: "destructive",
            });
          },
        },
      );
    } else {
      addMutation.mutate(entry, {
        onSuccess: async () => {
          // Create a debt_payment record to update the balance via trigger
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("debt_payments").insert({
                user_id: user.id,
                profile_id: activeProfile?.id || null,
                debt_id: formData.source_id,
                amount: parseFloat(formData.amount),
                payment_date: formData.payment_date,
                notes: formData.notes || undefined,
              });
            }
          } catch (error) {
            console.error("Error creating debt payment:", error);
          }
          toast({
            title: "Success",
            description: "Payment added successfully.",
          });
          setIsAddDialogOpen(false);
          resetForm();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to add payment.",
            variant: "destructive",
          });
        },
      });
    }
  };
  const resetForm = () => {
    setFormData({
      payment_type: "expense" as "income" | "expense" | "debt" | "savings",
      amount: "",
      payment_status: "pending" as "pending" | "paid" | "partial",
      payment_date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      source_id: "",
    });
    setEditingEntry(null);
  };
  const handleEdit = (entry: PaymentTrackerEntry) => {
    setEditingEntry(entry);
    setFormData({
      payment_type: entry.payment_type,
      amount: entry.amount.toString(),
      payment_status: entry.payment_status,
      payment_date: entry.payment_date || format(new Date(), "yyyy-MM-dd"),
      notes: entry.notes || "",
      source_id: entry.source_id || "",
    });
    setIsAddDialogOpen(true);
  };
  const handleDelete = (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Payment deleted successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete payment.",
          variant: "destructive",
        });
      },
    });
  };
  const monthName = format(currentMonth, "MMMM yyyy", { locale: language === "es" ? undefined : undefined });
  return (
    <>
      <AutoPaymentsGenerator language={language} />
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[160px] text-center font-semibold">{monthName}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Dialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t.addPayment}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingEntry ? t.editPayment : t.addPayment}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t.selectDebt}</Label>
                    <Select
                      value={formData.source_id}
                      onValueChange={(val: string) => setFormData({ ...formData, source_id: val })}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            language === "en"
                              ? "Choose a debt..."
                              : language === "es"
                                ? "Elige una deuda..."
                                : "Wybierz dług..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {debts
                          .filter((d) => d.balance > 0)
                          .map((debt) => (
                            <SelectItem key={debt.id} value={debt.id}>
                              {debt.name} - {formatCurrency(debt.balance)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.amount} (£)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.date}</Label>
                    <Input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.notes}</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={language === "en" ? "Optional notes..." : "Notas opcionales..."}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button onClick={handleSave}>{t.save}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
              <p className="text-sm text-muted-foreground mb-1">{t.totalPaid}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(monthlyTotals.totalPaidThisMonth)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <p className="text-sm text-muted-foreground mb-1">{t.expectedThisMonth}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(monthlyTotals.expectedThisMonth)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
              <p className="text-sm text-muted-foreground mb-1">{t.totalDebtBalance}</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(monthlyTotals.totalDebtBalance)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
              <p className="text-sm text-muted-foreground mb-1">
                {language === "en" ? "Extra Paid" : language === "es" ? "Extra Pagado" : "Dodatkowe Płatności"}
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(monthlyTotals.extraPaid)}
              </p>
            </div>
          </div>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noPayments}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => {
                const linkedDebt = payment.source_id ? debts.find((d) => d.id === payment.source_id) : null;
                // Check if it's a manual payment (from debt_payments table or marked as manual)
                const isManual = (payment as any).is_manual === true;
                const isAutoGenerated = !isManual;
                // Calculate projected balance for this debt in the viewing month
                const projectedBalance = linkedDebt
                  ? (() => {
                      const currentMonthStart = startOfMonth(currentMonth);
                      const currentMonthEnd = new Date(
                        currentMonthStart.getFullYear(),
                        currentMonthStart.getMonth() + 1,
                        0,
                      );
                      const debtPaymentsThisMonth = payments
                        .filter((p) => {
                          const paymentDate = p.payment_date ? new Date(p.payment_date) : null;
                          return (
                            p.source_id === linkedDebt.id &&
                            (p.payment_status === "paid" ||
                              (paymentDate && paymentDate >= currentMonthStart && paymentDate <= currentMonthEnd))
                          );
                        })
                        .reduce((sum, p) => sum + p.amount, 0);
                      return Math.max(0, linkedDebt.balance - debtPaymentsThisMonth);
                    })()
                  : 0;
                return (
                  <div
                    key={payment.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      isAutoGenerated ? "border-blue-500/30 bg-blue-500/5" : "border-green-500/30 bg-green-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <CheckCircle2
                        className={`h-5 w-5 ${isAutoGenerated ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{linkedDebt?.name || "Deuda"}</span>
                          <Badge variant={isAutoGenerated ? "secondary" : "default"} className="text-xs">
                            {isAutoGenerated ? "Automatic" : "Manual"}
                          </Badge>
                          {linkedDebt && (
                            <span className="text-sm text-muted-foreground">
                              Projected Balance: {formatCurrency(projectedBalance)}
                            </span>
                          )}
                        </div>
                        {payment.notes && <p className="text-sm text-muted-foreground mt-1">{payment.notes}</p>}
                        {payment.payment_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(payment.payment_date), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-lg font-bold ${isAutoGenerated ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}
                      >
                        {formatCurrency(payment.amount)}
                      </span>
                      <div className="flex gap-1">
                        {isManual ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {language === "en"
                                    ? "Delete manual payment?"
                                    : language === "es"
                                      ? "¿Eliminar pago manual?"
                                      : "Usunąć płatność ręczną?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {language === "en"
                                    ? "This action cannot be undone. The debt balance will be restored."
                                    : language === "es"
                                      ? "Esta acción no se puede deshacer. El balance de la deuda se restaurará."
                                      : "Tej operacji nie można cofnąć. Saldo długu zostanie przywrócone."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(payment.id)}>
                                  {t.delete}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(payment)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {language === "en"
                                      ? "Delete payment?"
                                      : language === "es"
                                        ? "¿Eliminar pago?"
                                        : "Usunąć płatność?"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === "en"
                                      ? "This action cannot be undone."
                                      : language === "es"
                                        ? "Esta acción no se puede deshacer."
                                        : "Tej operacji nie można cofnąć."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(payment.id)}>
                                    {t.delete}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
