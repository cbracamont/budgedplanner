import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, DollarSign } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { formatCurrency, Language } from "@/lib/i18n";
import { useMonthlyVariableIncome, useAddMonthlyVariableIncome, useUpdateMonthlyVariableIncome, useDeleteMonthlyVariableIncome, type MonthlyVariableIncome } from "@/hooks/useMonthlyVariableIncome";
interface MonthlyVariableIncomeTrackerProps {
  language: Language;
  onIncomeChange?: (total: number) => void;
}
export const MonthlyVariableIncomeTracker = ({
  language,
  onIncomeChange
}: MonthlyVariableIncomeTrackerProps) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingIncome, setEditingIncome] = useState<MonthlyVariableIncome | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: ""
  });
  const {
    data: incomes = [],
    isLoading
  } = useMonthlyVariableIncome(currentMonth);
  const addMutation = useAddMonthlyVariableIncome();
  const updateMutation = useUpdateMonthlyVariableIncome();
  const deleteMutation = useDeleteMonthlyVariableIncome();
  const monthTotal = useMemo(() => {
    const total = incomes.reduce((sum, income) => sum + Number(income.amount), 0);
    if (onIncomeChange) {
      onIncomeChange(total);
    }
    return total;
  }, [incomes, onIncomeChange]);
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
      description: ""
    });
    setIsAddDialogOpen(true);
  };
  const handleSaveNew = () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    addMutation.mutate({
      amount,
      date: formData.date,
      description: formData.description
    });
    setIsAddDialogOpen(false);
    setFormData({
      amount: "",
      date: format(currentMonth, "yyyy-MM-dd"),
      description: ""
    });
  };
  const handleEdit = (income: MonthlyVariableIncome) => {
    setEditingIncome(income);
    setFormData({
      amount: income.amount.toString(),
      date: income.date,
      description: income.description || ""
    });
    setIsEditDialogOpen(true);
  };
  const handleSaveEdit = () => {
    if (!editingIncome) return;
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    updateMutation.mutate({
      id: editingIncome.id,
      amount,
      date: formData.date,
      description: formData.description
    });
    setIsEditDialogOpen(false);
    setEditingIncome(null);
    setFormData({
      amount: "",
      date: format(currentMonth, "yyyy-MM-dd"),
      description: ""
    });
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
      title: "Monthly Variable Income",
      addIncome: "Add Income",
      amount: "Amount",
      date: "Date",
      description: "Description",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      deleteConfirm: "Are you sure you want to delete this income entry?",
      monthTotal: "Month Total",
      noEntries: "No variable income entries for this month"
    },
    es: {
      title: "Ingresos Variables Mensuales",
      addIncome: "Agregar Ingreso",
      amount: "Monto",
      date: "Fecha",
      description: "Descripción",
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      deleteConfirm: "¿Está seguro de eliminar este ingreso?",
      monthTotal: "Total del Mes",
      noEntries: "No hay ingresos variables para este mes"
    },
    pl: {
      title: "Miesięczne Zmienne Dochody",
      addIncome: "Dodaj Dochód",
      amount: "Kwota",
      date: "Data",
      description: "Opis",
      save: "Zapisz",
      cancel: "Anuluj",
      edit: "Edytuj",
      delete: "Usuń",
      deleteConfirm: "Czy na pewno chcesz usunąć ten wpis dochodu?",
      monthTotal: "Suma Miesiąca",
      noEntries: "Brak zmiennych dochodów w tym miesiącu"
    }
  };
  const translations = t[language];
  return <>
      <Card className="shadow-medium">
        <CardHeader className="bg-gradient-primary text-primary-foreground rounded-md bg-[#000a00]/[0.36]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <CardTitle className="text-lg">{translations.title}</CardTitle>
            </div>
            <Button onClick={handleAdd} size="sm" variant="secondary" className="gap-2">
              <Plus className="h-4 w-4" />
              {translations.addIncome}
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
              <h3 className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {translations.monthTotal}: <span className="font-bold text-income">{formatCurrency(monthTotal)}</span>
              </p>
            </div>

            <Button onClick={handleNextMonth} variant="outline" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Income List */}
          <div className="space-y-3">
            {isLoading ? <p className="text-center text-muted-foreground py-4">Cargando...</p> : incomes.length === 0 ? <p className="text-center text-muted-foreground py-4">{translations.noEntries}</p> : incomes.map(income => <div key={income.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-income">{formatCurrency(income.amount)}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(income.date), "dd/MM/yyyy")}
                      </span>
                    </div>
                    {income.description && <p className="text-sm text-muted-foreground mt-1">{income.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(income)} variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleDelete(income.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>)}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.addIncome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-amount">{translations.amount}</Label>
              <Input id="add-amount" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({
              ...formData,
              amount: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="add-date">{translations.date}</Label>
              <Input id="add-date" type="date" value={formData.date} onChange={e => setFormData({
              ...formData,
              date: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="add-description">{translations.description}</Label>
              <Textarea id="add-description" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} rows={3} />
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
              <Label htmlFor="edit-amount">{translations.amount}</Label>
              <Input id="edit-amount" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({
              ...formData,
              amount: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="edit-date">{translations.date}</Label>
              <Input id="edit-date" type="date" value={formData.date} onChange={e => setFormData({
              ...formData,
              date: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="edit-description">{translations.description}</Label>
              <Textarea id="edit-description" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} rows={3} />
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
    </>;
};