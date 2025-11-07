import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
} from "lucide-react";
import { Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  usePaymentTracker,
  useAddPaymentTracker,
  useUpdatePaymentTracker,
  useDeletePaymentTracker,
} from "@/hooks/usePaymentTracker";
import { useIncomeSources, useDebts, useFixedExpenses, useSavingsGoals } from "@/hooks/useFinancialData";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/i18n";
import { format, startOfMonth, addMonths, subMonths, isPast } from "date-fns";

interface PaymentEntry {
  id: string;
  month_year: string;
  payment_type: "income" | "expense" | "debt" | "savings";
  amount: number;
  payment_status: "pending" | "paid" | "partial";
  payment_date: string;
  notes?: string;
  source_id?: string;
}

interface MonthlyPaymentTrackerProps {
  language: Language;
}

export const MonthlyPaymentTracker = ({ language }: MonthlyPaymentTrackerProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PaymentEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "type" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [formData, setFormData] = useState({
    payment_type: "expense" as "income" | "expense" | "debt" | "savings",
    amount: "",
    payment_status: "pending" as "pending" | "paid" | "partial",
    payment_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    source_id: "",
  });

  const { data: payments = [] } = usePaymentTracker(currentMonth);
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
      type: "Type",
      amount: "Amount",
      status: "Status",
      date: "Date",
      notes: "Notes",
      pending: "Pending",
      paid: "Paid",
      partial: "Partial",
      income: "Income",
      expense: "Expense",
      debt: "Debt",
      savings: "Savings",
      noPayments: "No payments tracked this month",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      search: "Search payments",
      sort: "Sort by",
      totalPaid: "Total Paid",
      totalPending: "Total Pending",
      trend: "Trend",
      monthlyTrend: "Monthly Trend",
      noTrendData: "No trend data available",
      confirmDelete: "Are you sure you want to delete this payment?",
    },
    es: {
      title: "Seguimiento de Pagos Mensuales",
      description: "Rastrea lo que has pagado este mes",
      addPayment: "Añadir Pago",
      editPayment: "Editar Pago",
      type: "Tipo",
      amount: "Monto",
      status: "Estado",
      date: "Fecha",
      notes: "Notas",
      pending: "Pendiente",
      paid: "Pagado",
      partial: "Parcial",
      income: "Ingreso",
      expense: "Gasto",
      debt: "Deuda",
      savings: "Ahorro",
      noPayments: "No hay pagos registrados este mes",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      search: "Buscar pagos",
      sort: "Ordenar por",
      totalPaid: "Total Pagado",
      totalPending: "Total Pendiente",
      trend: "Tendencia",
      monthlyTrend: "Tendencia Mensual",
      noTrendData: "No hay datos de tendencia disponibles",
      confirmDelete: "¿Estás seguro de que quieres eliminar este pago?",
    },
    pl: {
      title: "Miesięczny Tracker Płatności",
      description: "Śledź, co zapłaciłeś w tym miesiącu",
      addPayment: "Dodaj Płatność",
      editPayment: "Edytuj Płatność",
      type: "Typ",
      amount: "Kwota",
      status: "Status",
      date: "Data",
      notes: "Notatki",
      pending: "Oczekujące",
      paid: "Zapłacone",
      partial: "Częściowe",
      income: "Dochód",
      expense: "Wydatek",
      debt: "Dług",
      savings: "Oszczędności",
      noPayments: "Brak płatności w tym miesiącu",
      save: "Zapisz",
      cancel: "Anuluj",
      delete: "Usuń",
      edit: "Edytuj",
      search: "Szukaj płatności",
      sort: "Sortuj po",
      totalPaid: "Razem Zapłacone",
      totalPending: "Razem Oczekujące",
      trend: "Trend",
      monthlyTrend: "Miesięczny Trend",
      noTrendData: "Brak danych trendu",
      confirmDelete: "Czy na pewno chcesz usunąć tę płatność?",
    },
  }[language];

  // Sorting and filtering
  const sortedPayments = useMemo(() => {
    let sorted = [...payments];
    if (sortBy === "amount") sorted.sort((a, b) => b.amount - a.amount);
    if (sortBy === "date") sorted.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    if (sortOrder === "asc") sorted.reverse();
    return sorted.filter(
      (payment) =>
        payment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.notes.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [payments, searchQuery, sortBy, sortOrder]);

  // Monthly totals
  const monthlyTotals = useMemo(() => {
    const paid = sortedPayments.filter((p) => p.payment_status === "paid").reduce((sum, p) => sum + p.amount, 0);
    const pending = sortedPayments.filter((p) => p.payment_status === "pending").reduce((sum, p) => sum + p.amount, 0);
    const total = paid + pending;
    return { paid, pending, total };
  }, [sortedPayments]);

  const handleSave = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    const entry = {
      month_year: format(startOfMonth(currentMonth), "yyyy-MM-dd"),
      payment_type: formData.payment_type,
      amount: parseFloat(formData.amount),
      payment_status: formData.payment_status,
      payment_date: formData.payment_date,
      notes: formData.notes || undefined,
      source_id: formData.source_id || undefined,
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
        onSuccess: () => {
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
      payment_type: "expense",
      amount: "",
      payment_status: "pending",
      payment_date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      source_id: "",
    });
    setEditingEntry(null);
  };

  const handleEdit = (entry: PaymentEntry) => {
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

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "default",
      pending: "secondary",
      partial: "outline",
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const getTypeColor = (type: string) => {
    const colors = {
      income: "text-green-600 dark:text-green-400",
      expense: "text-orange-600 dark:text-orange-400",
      debt: "text-red-600 dark:text-red-400",
      savings: "text-blue-600 dark:text-blue-400",
    };
    return colors[type as keyof typeof colors] || "";
  };

  const monthName = format(currentMonth, "MMMM yyyy", { locale: language === "es" ? undefined : undefined });

  return (
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
                  <Label>{t.type}</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(val: any) => setFormData({ ...formData, payment_type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">{t.income}</SelectItem>
                      <SelectItem value="expense">{t.expense}</SelectItem>
                      <SelectItem value="debt">{t.debt}</SelectItem>
                      <SelectItem value="savings">{t.savings}</SelectItem>
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
                  <Label>{t.status}</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(val: any) => setFormData({ ...formData, payment_status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t.pending}</SelectItem>
                      <SelectItem value="paid">{t.paid}</SelectItem>
                      <SelectItem value="partial">{t.partial}</SelectItem>
                    </SelectContent>
                  </Select>
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
        {payments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noPayments}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {payment.payment_status === "paid" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getStatusBadge(payment.payment_status) as any}>
                        {t[payment.payment_status as keyof typeof t]}
                      </Badge>
                      <span className={`font-semibold ${getTypeColor(payment.payment_type)}`}>
                        {t[payment.payment_type as keyof typeof t]}
                      </span>
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
                  <span className="text-lg font-bold">{formatCurrency(payment.amount)}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(payment)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(payment.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
