import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShoppingCart, Trash2, Plus, Pencil } from "lucide-react";
import { getTranslation, Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useVariableExpenses, useAddVariableExpense, useUpdateVariableExpense, useDeleteVariableExpense } from "@/hooks/useFinancialData";

interface VariableExpense {
  id: string;
  name: string;
  amount: number;
}

interface VariableExpensesManagerProps {
  onExpensesChange?: (total: number) => void;
  language: Language;
}

export const VariableExpensesManager = ({ onExpensesChange, language }: VariableExpensesManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const { data: expenses = [] } = useVariableExpenses();
  const addExpenseMutation = useAddVariableExpense();
  const updateExpenseMutation = useUpdateVariableExpense();
  const deleteExpenseMutation = useDeleteVariableExpense();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [editingExpense, setEditingExpense] = useState<VariableExpense | null>(null);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);

  useEffect(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    onExpensesChange?.(total);
  }, [expenses, onExpensesChange]);

  const addExpense = async () => {
    if (!name.trim() || !amount) return;

    addExpenseMutation.mutate({
      name: name.trim(),
      amount: parseFloat(parseFloat(amount).toFixed(2))
    }, {
      onSuccess: () => {
        setName("");
        setAmount("");
      }
    });
  };

  const deleteExpense = async (expenseId: string) => {
    deleteExpenseMutation.mutate(expenseId);
  };

  const updateExpense = async () => {
    if (!editingExpense) return;

    updateExpenseMutation.mutate({
      id: editingExpense.id,
      name: editingExpense.name,
      amount: parseFloat(parseFloat(editingExpense.amount.toString()).toFixed(2))
    }, {
      onSuccess: () => {
        setIsEditExpenseDialogOpen(false);
        setEditingExpense(null);
      }
    });
  };

  return (
    <Card className="shadow-medium border-warning/20">
      <CardHeader className="bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <CardTitle>{t('variableExpenses')}</CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Manage your monthly variable expenses' : 'Gestiona tus gastos variables mensuales'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Add Expense */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            {language === 'en' ? 'Add Expense' : 'Añadir Gasto'}
          </Label>
          <div className="grid gap-3">
            <div>
              <Label>{language === 'en' ? 'Name' : 'Nombre'}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'en' ? 'Expense name' : 'Nombre del gasto'}
              />
            </div>
            <div>
              <Label>{language === 'en' ? 'Amount' : 'Monto'}</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button onClick={addExpense}>
              {language === 'en' ? 'Add Expense' : 'Añadir Gasto'}
            </Button>
          </div>
        </div>

        {/* Expenses List */}
        {expenses.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">
              {language === 'en' ? 'Current Expenses' : 'Gastos Actuales'}
            </Label>
            <div className="grid gap-2">
              {expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <div>
                    <p className="font-medium">{expense.name}</p>
                    <p className="text-lg font-bold text-primary">£{expense.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingExpense(expense);
                        setIsEditExpenseDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Expense Dialog */}
        <Dialog open={isEditExpenseDialogOpen} onOpenChange={setIsEditExpenseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'en' ? 'Edit Expense' : 'Editar Gasto'}</DialogTitle>
            </DialogHeader>
            {editingExpense && (
              <div className="space-y-4">
                <div>
                  <Label>{language === 'en' ? 'Name' : 'Nombre'}</Label>
                  <Input
                    value={editingExpense.name}
                    onChange={(e) => setEditingExpense({ ...editingExpense, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Amount' : 'Monto'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditExpenseDialogOpen(false)}>
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </Button>
              <Button onClick={updateExpense}>
                {language === 'en' ? 'Save Changes' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};