import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Receipt } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isBefore, isAfter } from "date-fns";
import { formatCurrency, Language } from "@/lib/i18n";
import { useVariableExpenses, useAddVariableExpense, useUpdateVariableExpense, useDeleteVariableExpense } from "@/hooks/useFinancialData";

interface VariableExpensesTrackerProps {
  language?: Language;
}

export const VariableExpensesTracker = ({ language = "en" }: VariableExpensesTrackerProps) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: "", amount: "" });

  const { data: allExpenses = [], isLoading } = useVariableExpenses();
  const addMutation = useAddVariableExpense();
  const updateMutation = useUpdateVariableExpense();
  const deleteMutation = useDeleteVariableExpense();

  // Show expenses that existed during the selected month
  // (created on or before end of selected month)
  const monthExpenses = useMemo(() => {
    const monthEnd = endOfMonth(currentMonth);
    return allExpenses.filter(e => {
      const createdAt = new Date(e.created_at);
      return !isAfter(createdAt, monthEnd);
    });
  }, [allExpenses, currentMonth]);

  const monthTotal = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [monthExpenses]);

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const handleAdd = () => {
    setFormData({ name: "", amount: "" });
    setIsAddDialogOpen(true);
  };

  const handleSaveNew = () => {
    const amount = parseFloat(formData.amount);
    if (!formData.name || isNaN(amount) || amount <= 0) return;
    addMutation.mutate({ name: formData.name, amount });
    setIsAddDialogOpen(false);
    setFormData({ name: "", amount: "" });
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({ name: expense.name || "", amount: expense.amount.toString() });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingExpense) return;
    const amount = parseFloat(formData.amount);
    if (!formData.name || isNaN(amount) || amount <= 0) return;
    updateMutation.mutate({ id: editingExpense.id, name: formData.name, amount });
    setIsEditDialogOpen(false);
    setEditingExpense(null);
    setFormData({ name: "", amount: "" });
  };

  const handleDelete = (id: string) => setDeleteId(id);

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
      name: "Name",
      amount: "Amount",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      deleteConfirm: "Are you sure you want to delete this expense?",
      monthTotal: "Month Total",
      noEntries: "No variable expenses for this month",
      added: "Added",
    },
    es: {
      title: "Gastos Variables Mensuales",
      addExpense: "Agregar Gasto",
      name: "Nombre",
      amount: "Monto",
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      deleteConfirm: "¿Está seguro de eliminar este gasto?",
      monthTotal: "Total del Mes",
      noEntries: "No hay gastos variables para este mes",
      added: "Agregado",
    },
    pt: {
      title: "Despesas Variáveis Mensais",
      addExpense: "Adicionar Despesa",
      name: "Nome",
      amount: "Valor",
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      deleteConfirm: "Tem certeza que deseja eliminar esta despesa?",
      monthTotal: "Total do Mês",
      noEntries: "Nenhuma despesa variável neste mês",
      added: "Adicionado",
    },
  };
  const translations = t[language];

  return (
    <>
      <Card className="shadow-lg bg-gradient-to-br from-card to-card/95 backdrop-blur-md border-border/60 hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-warning/20 via-warning/15 to-warning/10 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20 text-warning">
                <Receipt className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-semibold">{translations.title}</CardTitle>
            </div>
            <Button onClick={handleAdd} size="sm" variant="secondary" className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              {translations.addExpense}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button onClick={handlePrevMonth} variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <h3 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.monthTotal}: <span className="font-bold text-warning">{formatCurrency(monthTotal)}</span>
              </p>
            </div>

            <Button onClick={handleNextMonth} variant="outline" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Expenses List */}
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : monthExpenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">{translations.noEntries}</p>
            ) : (
              monthExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-card to-card/90 border border-border/50 rounded-lg hover:shadow-md hover:border-warning/30 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{expense.name || "Unnamed"}</p>
                      <span className="text-xs text-muted-foreground">
                        {translations.added} {format(new Date(expense.created_at), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-warning mt-1">{formatCurrency(expense.amount)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(expense)} variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleDelete(expense.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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
                placeholder="e.g. Groceries, Gas, Restaurant"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
