import { useState, useMemo } from "react";
import { SectionCard, SectionEmpty, SectionLoading } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Receipt } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isBefore, isAfter } from "date-fns";
import { formatCurrency, Language } from "@/lib/i18n";
import { useVariableExpenses, useAddVariableExpense, useUpdateVariableExpense, useDeleteVariableExpense } from "@/hooks/useFinancialData";
import { useExpenseCategories } from "@/hooks/useCategoryBudgets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface VariableExpensesTrackerProps {
  language?: Language;
}

export const VariableExpensesTracker = ({ language = "en" }: VariableExpensesTrackerProps) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: "", amount: "", categoryId: "none" });

  const { data: allExpenses = [], isLoading } = useVariableExpenses();
  const { data: categories = [] } = useExpenseCategories();
  const categoryName = (id: string | null | undefined) =>
    categories.find((c) => c.id === id)?.name ?? null;
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
    setFormData({ name: "", amount: "", categoryId: "none" });
    setIsAddDialogOpen(true);
  };

  const handleSaveNew = () => {
    const amount = parseFloat(formData.amount);
    if (!formData.name || isNaN(amount) || amount <= 0) return;
    addMutation.mutate({
      name: formData.name,
      amount,
      category_id: formData.categoryId === "none" ? null : formData.categoryId,
    });
    setIsAddDialogOpen(false);
    setFormData({ name: "", amount: "", categoryId: "none" });
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({ name: expense.name || "", amount: expense.amount.toString(), categoryId: expense.category_id || "none" });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingExpense) return;
    const amount = parseFloat(formData.amount);
    if (!formData.name || isNaN(amount) || amount <= 0) return;
    updateMutation.mutate({
      id: editingExpense.id,
      name: formData.name,
      amount,
      category_id: formData.categoryId === "none" ? null : formData.categoryId,
    });
    setIsEditDialogOpen(false);
    setEditingExpense(null);
    setFormData({ name: "", amount: "", categoryId: "none" });
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
      category: "Category",
      noCategory: "No category",
      name: "Name",
      amount: "Amount",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      deleteConfirm: "Are you sure you want to delete this expense?",
      monthTotal: "Month Total",
      noEntries: "No variable expenses for this month",
      added: "Last modified",
    },
    es: {
      title: "Gastos Variables Mensuales",
      addExpense: "Agregar Gasto",
      category: "Categoría",
      noCategory: "Sin categoría",
      name: "Nombre",
      amount: "Monto",
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      deleteConfirm: "¿Está seguro de eliminar este gasto?",
      monthTotal: "Total del Mes",
      noEntries: "No hay gastos variables para este mes",
      added: "Última modificación",
    },
    pt: {
      title: "Despesas Variáveis Mensais",
      addExpense: "Adicionar Despesa",
      category: "Categoria",
      noCategory: "Sem categoria",
      name: "Nome",
      amount: "Valor",
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      deleteConfirm: "Tem certeza que deseja eliminar esta despesa?",
      monthTotal: "Total do Mês",
      noEntries: "Nenhuma despesa variável neste mês",
      added: "Última modificação",
    },
  };
  const translations = t[language];

  return (
    <>
      <SectionCard
        accent="expense"
        icon={Receipt}
        title={translations.title}
        actions={
          <Button onClick={handleAdd} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {translations.addExpense}
          </Button>
        }
      >
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
              <SectionLoading />
            ) : monthExpenses.length === 0 ? (
              <SectionEmpty icon={Receipt} title={translations.noEntries} />
            ) : (
              monthExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg hover:border-warning/40 hover:shadow-sm transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{expense.name || "Unnamed"}</p>
                      {categoryName(expense.category_id) && (
                        <Badge variant="secondary" className="text-xs">{categoryName(expense.category_id)}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {translations.added} {format(new Date(expense.updated_at), "dd/MM/yyyy")}
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
      </SectionCard>

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
              <Label htmlFor="add-category">{translations.category}</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger id="add-category">
                  <SelectValue placeholder={translations.category} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{translations.noCategory}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="edit-category">{translations.category}</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder={translations.category} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{translations.noCategory}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
