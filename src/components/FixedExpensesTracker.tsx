// src/components/FixedExpensesTracker.tsx
import { Trash2, Plus, CalendarIcon, Pencil, Check, X, Home } from "lucide-react";
import { useFixedExpenses, useAddFixedExpense, useDeleteFixedExpense, useUpdateFixedExpense } from "@/hooks/useFinancialData";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard, SectionEmpty, SectionLoading } from "@/components/ui/section-card";
import { getTranslation, formatCurrency, Language } from "@/lib/i18n";
type Frequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";
interface VariableExpense {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

// Multiplicadores exactos para convertir cualquier frecuencia a mensual
const frequencyMultiplier: Record<Frequency, number> = {
  weekly: 4.333,
  "bi-weekly": 2,
  monthly: 1,
  quarterly: 0.333,
  annually: 0.0833
};
interface FixedExpensesTrackerProps {
  language?: Language;
}

export const FixedExpensesTracker = ({ language = 'en' }: FixedExpensesTrackerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const {
    toast
  } = useToast();
  const {
    data: expenses = [],
    isLoading
  } = useFixedExpenses();
  const addExpenseMutation = useAddFixedExpense();
  const deleteExpenseMutation = useDeleteFixedExpense();
  const updateExpenseMutation = useUpdateFixedExpense();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: 0,
    frequency: "monthly" as Frequency,
    date: new Date()
  });

  // Calculate monthly total from database expenses
  const monthlyTotal = expenses.reduce((total, expense) => {
    const frequency = expense.frequency_type as Frequency;
    return total + expense.amount * (frequencyMultiplier[frequency] || 1);
  }, 0);
  const handleAdd = async () => {
    if (newExpense.name.trim() && newExpense.amount > 0) {
      try {
        await addExpenseMutation.mutateAsync({
          name: newExpense.name,
          amount: newExpense.amount,
          payment_day: newExpense.date.getDate(),
          frequency_type: newExpense.frequency
        });
        setNewExpense({
          name: "",
          amount: 0,
          frequency: "monthly",
          date: new Date()
        });
        setIsAdding(false);
        toast({
          title: "Expense Added",
          description: "Fixed expense has been added successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add expense",
          variant: "destructive"
        });
      }
    }
  };
  const handleDelete = async (id: string) => {
    try {
      await deleteExpenseMutation.mutateAsync(id);
      toast({ title: "Expense Deleted", description: "Fixed expense has been deleted successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to delete expense", variant: "destructive" });
    }
  };
  const handleStartEdit = (expense: { id: string; amount: number }) => {
    setEditingId(expense.id);
    setEditAmount(expense.amount);
  };

  const handleSaveEdit = async (id: string) => {
    if (editAmount > 0) {
      try {
        await updateExpenseMutation.mutateAsync({ id, amount: editAmount });
        setEditingId(null);
        toast({ title: "Expense Updated", description: "Amount has been updated successfully" });
      } catch {
        toast({ title: "Error", description: "Failed to update expense", variant: "destructive" });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };
  return (
    <SectionCard
      accent="expense"
      icon={Home}
      title={t('fixedExpenses')}
      description={language === 'en' ? 'Committed recurring expenses' : language === 'pt' ? 'Despesas recorrentes comprometidas' : 'Gastos recurrentes comprometidos'}
      actions={
        <Button onClick={() => setIsAdding(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {language === 'en' ? 'Add expense' : language === 'pt' ? 'Adicionar despesa' : 'Añadir gasto'}
        </Button>
      }
    >
      {isLoading ? (
        <SectionLoading />
      ) : expenses.length === 0 ? (
        <SectionEmpty
          icon={Home}
          title={t('emptyFixedExpensesTitle')}
          description={t('emptyFixedExpensesDesc')}
        />
      ) : (
        <div className="space-y-3">
          {expenses.map(expense => (
            <div
              key={expense.id}
              className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg hover:border-warning/40 hover:shadow-sm transition-all"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{expense.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {expense.frequency_type === "bi-weekly" ? "Bi-weekly" : expense.frequency_type} · {language === 'en' ? 'Day' : language === 'pt' ? 'Dia' : 'Día'} {expense.payment_day}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {editingId === expense.id ? (
                  <>
                    <Input
                      type="number"
                      value={editAmount || ""}
                      onChange={(e) => setEditAmount(Number(e.target.value))}
                      className="w-28 text-right font-semibold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(expense.id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(expense.id)}>
                      <Check className="h-4 w-4 text-income" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-bold text-warning">{formatCurrency(expense.amount)}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleStartEdit(expense)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="space-y-4 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <h3 className="font-semibold">
            {language === 'en' ? 'New fixed expense' : language === 'pt' ? 'Nova despesa fixa' : 'Nuevo gasto fijo'}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Name' : language === 'pt' ? 'Nome' : 'Nombre'}</Label>
              <Input
                placeholder={language === 'en' ? 'e.g. Gym membership' : language === 'pt' ? 'ex. Academia' : 'ej. Gimnasio'}
                value={newExpense.name}
                onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Amount' : language === 'pt' ? 'Valor' : 'Monto'}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newExpense.amount || ""}
                onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Frequency' : language === 'pt' ? 'Frequência' : 'Frecuencia'}</Label>
              <Select
                value={newExpense.frequency}
                onValueChange={(value) => setNewExpense({ ...newExpense, frequency: value as Frequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'First payment' : language === 'pt' ? 'Primeiro pagamento' : 'Primer pago'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !newExpense.date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newExpense.date ? format(newExpense.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newExpense.date}
                    onSelect={(date) => date && setNewExpense({ ...newExpense, date })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd}>
              {language === 'en' ? 'Save expense' : language === 'pt' ? 'Salvar despesa' : 'Guardar gasto'}
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              {language === 'en' ? 'Cancel' : language === 'pt' ? 'Cancelar' : 'Cancelar'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          {language === 'en' ? 'Total fixed expenses per month' : language === 'pt' ? 'Total de despesas fixas por mês' : 'Total de gastos fijos por mes'}
        </p>
        <p className="text-2xl font-bold text-warning">{formatCurrency(monthlyTotal)}</p>
      </div>
    </SectionCard>
  );
};
