import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Home, Plus, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTranslation, Language } from "@/lib/i18n";

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  payment_day: number;
  frequency: string;
  frequency_type: 'monthly' | 'annual';
  payment_month?: number | null;
}

interface FixedExpensesManagerProps {
  language: Language;
  onExpensesChange: (total: number) => void;
}

const monthNames = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
};

export const FixedExpensesManager = ({ language, onExpensesChange }: FixedExpensesManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    payment_day: "1",
    frequency_type: "monthly" as 'monthly' | 'annual',
    payment_month: null as number | null
  });
  const [editingExpense, setEditingExpense] = useState<{
    id: string;
    name: string;
    amount: number;
    payment_day: number;
    frequency_type: 'monthly' | 'annual';
    payment_month: number | null;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    onExpensesChange(total);
  }, [expenses, onExpensesChange]);

  const loadExpenses = async () => {
    const { data, error } = await supabase
      .from("fixed_expenses")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to load expenses", variant: "destructive" });
    } else {
      setExpenses((data || []) as FixedExpense[]);
    }
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.name || !newExpense.amount) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("fixed_expenses").insert({
      user_id: user.id,
      name: newExpense.name,
      amount: parseFloat(newExpense.amount),
      payment_day: parseInt(newExpense.payment_day),
      frequency: "monthly",
      frequency_type: newExpense.frequency_type,
      payment_month: newExpense.frequency_type === 'annual' ? newExpense.payment_month : null
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add expense", variant: "destructive" });
    } else {
      setNewExpense({ name: "", amount: "", payment_day: "1", frequency_type: "monthly", payment_month: null });
      loadExpenses();
      toast({ title: "Success", description: "Expense added" });
    }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete expense", variant: "destructive" });
    } else {
      loadExpenses();
      toast({ title: "Success", description: "Expense deleted" });
    }
  };

  const updateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const { error } = await supabase
      .from("fixed_expenses")
      .update({
        name: editingExpense.name,
        amount: editingExpense.amount,
        payment_day: editingExpense.payment_day,
        frequency_type: editingExpense.frequency_type,
        payment_month: editingExpense.frequency_type === 'annual' ? editingExpense.payment_month : null
      })
      .eq("id", editingExpense.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update expense", variant: "destructive" });
    } else {
      setIsEditDialogOpen(false);
      setEditingExpense(null);
      loadExpenses();
      toast({ title: "Success", description: "Expense updated" });
    }
  };

  return (
    <Card className="shadow-medium border-warning/20">
      <CardHeader className="bg-warning/10 border-b border-warning/20">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-warning" />
          <CardTitle>{t('fixedExpenses')}</CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Manage your fixed monthly and annual expenses' : 'Administra tus gastos fijos mensuales y anuales'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <form onSubmit={addExpense} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expense-name">
                {language === 'en' ? 'Name' : 'Nombre'}
              </Label>
              <Input
                id="expense-name"
                placeholder={language === 'en' ? 'Rent, Utilities, etc.' : 'Alquiler, Servicios, etc.'}
                value={newExpense.name}
                onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">
                {language === 'en' ? 'Amount' : 'Monto'}
              </Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency-type">
                {language === 'en' ? 'Frequency' : 'Frecuencia'}
              </Label>
              <Select
                value={newExpense.frequency_type}
                onValueChange={(value: 'monthly' | 'annual') => 
                  setNewExpense({ ...newExpense, frequency_type: value, payment_month: value === 'monthly' ? null : newExpense.payment_month })
                }
              >
                <SelectTrigger id="frequency-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{language === 'en' ? 'Monthly' : 'Mensual'}</SelectItem>
                  <SelectItem value="annual">{language === 'en' ? 'Annual' : 'Anual'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newExpense.frequency_type === 'annual' && (
              <div className="space-y-2">
                <Label htmlFor="payment-month">
                  {language === 'en' ? 'Payment Month' : 'Mes de Pago'}
                </Label>
                <Select
                  value={newExpense.payment_month?.toString() || ""}
                  onValueChange={(value) => setNewExpense({ ...newExpense, payment_month: parseInt(value) })}
                >
                  <SelectTrigger id="payment-month">
                    <SelectValue placeholder={language === 'en' ? 'Select month' : 'Selecciona mes'} />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames[language].map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="expense-day">
                {language === 'en' ? 'Payment Day' : 'Día de Pago'}
              </Label>
              <Input
                id="expense-day"
                type="number"
                min="1"
                max="31"
                value={newExpense.payment_day}
                onChange={(e) => setNewExpense({ ...newExpense, payment_day: e.target.value })}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {language === 'en' ? 'Add Fixed Expense' : 'Agregar Gasto Fijo'}
          </Button>
        </form>

        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{expense.name}</p>
                <p className="text-sm text-muted-foreground">
                  £{expense.amount.toFixed(2)} - {expense.frequency_type === 'annual' 
                    ? `${monthNames[language][expense.payment_month! - 1]}, ${language === 'en' ? 'Day' : 'Día'} ${expense.payment_day}`
                    : `${language === 'en' ? 'Day' : 'Día'} ${expense.payment_day}`}
                  {expense.frequency_type === 'annual' && ` (${language === 'en' ? 'Annual' : 'Anual'})`}
                </p>
              </div>
              <div className="flex gap-1">
                <Dialog open={isEditDialogOpen && editingExpense?.id === expense.id} onOpenChange={(open) => {
                  setIsEditDialogOpen(open);
                  if (!open) setEditingExpense(null);
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingExpense({
                          id: expense.id,
                          name: expense.name,
                          amount: expense.amount,
                          payment_day: expense.payment_day,
                          frequency_type: expense.frequency_type,
                          payment_month: expense.payment_month
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{language === 'en' ? 'Edit Fixed Expense' : 'Editar Gasto Fijo'}</DialogTitle>
                    </DialogHeader>
                    {editingExpense && (
                      <form onSubmit={updateExpense} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-expense-name">{language === 'en' ? 'Name' : 'Nombre'}</Label>
                          <Input
                            id="edit-expense-name"
                            value={editingExpense.name}
                            onChange={(e) => setEditingExpense({...editingExpense, name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-expense-amount">{language === 'en' ? 'Amount' : 'Monto'}</Label>
                          <Input
                            id="edit-expense-amount"
                            type="number"
                            step="0.01"
                            value={editingExpense.amount}
                            onChange={(e) => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value)})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-frequency-type">{language === 'en' ? 'Frequency' : 'Frecuencia'}</Label>
                          <Select
                            value={editingExpense.frequency_type}
                            onValueChange={(value: 'monthly' | 'annual') => 
                              setEditingExpense({...editingExpense, frequency_type: value, payment_month: value === 'monthly' ? null : editingExpense.payment_month})
                            }
                          >
                            <SelectTrigger id="edit-frequency-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">{language === 'en' ? 'Monthly' : 'Mensual'}</SelectItem>
                              <SelectItem value="annual">{language === 'en' ? 'Annual' : 'Anual'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {editingExpense.frequency_type === 'annual' && (
                          <div className="space-y-2">
                            <Label htmlFor="edit-payment-month">{language === 'en' ? 'Payment Month' : 'Mes de Pago'}</Label>
                            <Select
                              value={editingExpense.payment_month?.toString() || ""}
                              onValueChange={(value) => setEditingExpense({...editingExpense, payment_month: parseInt(value)})}
                            >
                              <SelectTrigger id="edit-payment-month">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {monthNames[language].map((month, index) => (
                                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                                    {month}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="edit-expense-day">{language === 'en' ? 'Payment Day' : 'Día de Pago'}</Label>
                          <Input
                            id="edit-expense-day"
                            type="number"
                            min="1"
                            max="31"
                            value={editingExpense.payment_day}
                            onChange={(e) => setEditingExpense({...editingExpense, payment_day: parseInt(e.target.value)})}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {language === 'en' ? 'Update' : 'Actualizar'}
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteExpense(expense.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};