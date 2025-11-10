import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, ShoppingCart } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { formatCurrency, Language } from "@/lib/i18n";
import {
  useMonthlyVariableExpenses,
  useAddMonthlyVariableExpense,
  useUpdateMonthlyVariableExpense,
  useDeleteMonthlyVariableExpense,
  type MonthlyVariableExpense,
} from "@/hooks/useMonthlyVariableExpenses";

interface MonthlyVariableExpensesTrackerProps {
  language: Language;
  onExpensesChange?: (total: number) => void;
}

export const MonthlyVariableExpensesTracker = ({ language, onExpensesChange }: MonthlyVariableExpensesTrackerProps) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<MonthlyVariableExpense | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    name: "",
  });

  const { data: expenses = [], isLoading } = useMonthlyVariableExpenses(currentMonth);
  const addMutation = useAddMonthlyVariableExpense();
  const updateMutation = useUpdateMonthlyVariableExpense();
  const deleteMutation = useDeleteMonthlyVariableExpense();

  const monthTotal = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    if (onExpensesChange) {
      onExpensesChange(total);
    }
    return total;
  }, [expenses, onExpensesChange]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleAdd = () => {
    setFormData({
      amount: "",
      date: format(currentMonth, "yyyy-MM-dd"),
      name: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleSaveNew = () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0 || !formData.name.trim()) {
      return;
    }

    addMutation.mutate({
      amount,
      date: formData.date,
      name: formData.name.trim(),
    });

    setIsAddDialogOpen(false);
    setFormData({ amount: "", date: format(currentMonth, "yyyy-MM-dd"), name: "" });
  };

  const handleEdit = (expense: MonthlyVariableExpense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      date: expense.date,
      name: expense.name || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingExpense) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0 || !formData.name.trim()) {
      return;
    }

    updateMutation.mutate({
      id: editingExpense.id,
      amount,
      date: formData.date,
      name: formData.name.trim(),
    });

    setIsEditDialogOpen(false);
    setEditingExpense(null);
    setFormData({ amount: "", date: format(currentMonth, "yyyy-MM-dd"), name: "" });
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const t = {
    en: {
      title: "Monthly Variable Expenses",
      addExpense: "Add Expense",
      amount: "Amount",
      date: "Date",
      name: "Name",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      deleteConfirm: "Are you sure you want to delete this expense entry?",
      monthTotal: "Month Total",
      noEntries: "No variable expenses for this month",
    },
    es: {
      title: "Gastos Variables Mensuales",
      addExpense: "Agregar Gasto",
      amount: "Monto",
      date: "Fecha",
      name: "Nombre",
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      deleteConfirm: "¿Está seguro de eliminar este gasto?",
      monthTotal: "Total del Mes",
      noEntries: "No hay gastos variables para este mes",
    },
    pl: {
      title: "Miesięczne Zmienne Wydatki",
      addExpense: "Dodaj Wydatek",
      amount: "Kwota",
      date: "Data",
      name: "Nazwa",
      save: "Zapisz",
      cancel: "Anuluj",
      edit: "Edytuj",
      delete: "Usuń",
      deleteConfirm: "Czy na pewno chcesz usunąć ten wpis wydatku?",
      monthTotal: "Suma Miesiąca",
      noEntries: "Brak zmiennych wydatków w tym miesiącu",
    },
  };

  const translations = t[language];

  return (
    <>
      <Card className="shadow-medium">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <CardTitle className="text-lg">{translations.title}</CardTitle>
            </div>
            <Button
              onClick={handleAdd}
              size="sm"
              variant="secondary"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {translations.addExpense}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={handlePrevMonth}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {translations.monthTotal}: <span className="font-bold text-destructive">{formatCurrency(monthTotal)}</span>
              </p>
            </div>

            <Button
              onClick={handleNextMonth}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Expenses List */}
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Cargando...</p>
            ) : expenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">{translations.noEntries}</p>
            ) : (
              expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-destructive">{formatCurrency(expense.amount)}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), "dd/MM/yyyy")}
                      </span>
                    </div>
                    {expense.name && (
                      <p className="text-sm text-muted-foreground mt-1">{expense.name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(expense)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(expense.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.addExpense}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-name">{translations.name}</Label>
              <Input
                id="add-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={translations.name}
              />
            </div>
            <div>
              <Label htmlFor="add-amount">{translations.amount}</Label>
              <Input
                id="add-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="add-date">{translations.date}</Label>
              <Input
                id="add-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {translations.cancel}
            </Button>
            <Button onClick={handleSaveNew}>{translations.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.edit}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{translations.name}</Label>
              <Input
                id="edit-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-amount">{translations.amount}</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-date">{translations.date}</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {translations.cancel}
            </Button>
            <Button onClick={handleSaveEdit}>{translations.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.delete}</AlertDialogTitle>
            <AlertDialogDescription>{translations.deleteConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{translations.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
