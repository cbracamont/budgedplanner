import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShoppingCart, Trash2, Plus, Pencil } from "lucide-react";
import { getTranslation, Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface VariableExpense {
  id: string;
  category_id: string;
  amount: number;
  category?: Category;
}

interface VariableExpensesManagerProps {
  onExpensesChange: (total: number) => void;
  language: Language;
}

export const VariableExpensesManager = ({ onExpensesChange, language }: VariableExpensesManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<VariableExpense[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<VariableExpense | null>(null);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);

  useEffect(() => {
    loadCategories();
    loadExpenses();
  }, []);

  useEffect(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    onExpensesChange(total);
  }, [expenses, onExpensesChange]);

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('variable_expense_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    if (data && data.length > 0) {
      setCategories(data);
    } else {
      await createDefaultCategories(user.id);
    }
  };

  const createDefaultCategories = async (userId: string) => {
    const defaultCategories = [
      { name: 'Groceries', user_id: userId },
      { name: 'Dining Out', user_id: userId },
      { name: 'Transport', user_id: userId },
      { name: 'Shopping', user_id: userId },
      { name: 'Entertainment', user_id: userId }
    ];

    const { data, error } = await supabase
      .from('variable_expense_categories')
      .insert(defaultCategories)
      .select();

    if (!error && data) {
      setCategories(data);
    }
  };

  const loadExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('variable_expenses')
      .select(`
        *,
        category:variable_expense_categories(*)
      `)
      .eq('user_id', user.id);

    if (!error && data) {
      setExpenses(data);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('variable_expense_categories')
      .insert({ name: newCategoryName, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
      return;
    }

    setCategories([...categories, data]);
    setNewCategoryName("");
    setIsAddingCategory(false);
    toast({ title: "Success", description: "Category added successfully" });
  };

  const deleteCategory = async (categoryId: string) => {
    const { error } = await supabase
      .from('variable_expense_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
      return;
    }

    setCategories(categories.filter(c => c.id !== categoryId));
    toast({ title: "Success", description: "Category deleted successfully" });
  };

  const updateCategory = async () => {
    if (!editingCategory) return;

    const { error } = await supabase
      .from('variable_expense_categories')
      .update({ name: editingCategory.name })
      .eq('id', editingCategory.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
      return;
    }

    setCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
    setIsEditCategoryDialogOpen(false);
    setEditingCategory(null);
    toast({ title: "Success", description: "Category updated successfully" });
  };

  const addExpense = async () => {
    if (!selectedCategory || !amount) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('variable_expenses')
      .insert({
        category_id: selectedCategory,
        amount: parseFloat(amount),
        user_id: user.id
      })
      .select(`
        *,
        category:variable_expense_categories(*)
      `)
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add expense", variant: "destructive" });
      return;
    }

    setExpenses([...expenses, data]);
    setSelectedCategory("");
    setAmount("");
    toast({ title: "Success", description: "Expense added successfully" });
  };

  const deleteExpense = async (expenseId: string) => {
    const { error } = await supabase
      .from('variable_expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete expense", variant: "destructive" });
      return;
    }

    setExpenses(expenses.filter(e => e.id !== expenseId));
    toast({ title: "Success", description: "Expense deleted successfully" });
  };

  const updateExpense = async () => {
    if (!editingExpense) return;

    const { error } = await supabase
      .from('variable_expenses')
      .update({ amount: editingExpense.amount })
      .eq('id', editingExpense.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update expense", variant: "destructive" });
      return;
    }

    setExpenses(expenses.map(e => e.id === editingExpense.id ? editingExpense : e));
    setIsEditExpenseDialogOpen(false);
    setEditingExpense(null);
    toast({ title: "Success", description: "Expense updated successfully" });
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
        {/* Categories Management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              {language === 'en' ? 'Categories' : 'Categorías'}
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingCategory(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {language === 'en' ? 'Add Category' : 'Añadir Categoría'}
            </Button>
          </div>

          {isAddingCategory && (
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={language === 'en' ? 'Category name' : 'Nombre de categoría'}
              />
              <Button onClick={addCategory}>
                {language === 'en' ? 'Add' : 'Añadir'}
              </Button>
              <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </Button>
            </div>
          )}

          <div className="grid gap-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <span className="font-medium">{category.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(category);
                      setIsEditCategoryDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Expense */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-base font-semibold">
            {language === 'en' ? 'Add Expense' : 'Añadir Gasto'}
          </Label>
          <div className="grid gap-3">
            <div>
              <Label>{language === 'en' ? 'Category' : 'Categoría'}</Label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">{language === 'en' ? 'Select category' : 'Seleccionar categoría'}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
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
                    <p className="font-medium">{expense.category?.name}</p>
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

        {/* Edit Category Dialog */}
        <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'en' ? 'Edit Category' : 'Editar Categoría'}</DialogTitle>
            </DialogHeader>
            {editingCategory && (
              <div className="space-y-4">
                <div>
                  <Label>{language === 'en' ? 'Category Name' : 'Nombre de Categoría'}</Label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </Button>
              <Button onClick={updateCategory}>
                {language === 'en' ? 'Save Changes' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Expense Dialog */}
        <Dialog open={isEditExpenseDialogOpen} onOpenChange={setIsEditExpenseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'en' ? 'Edit Expense' : 'Editar Gasto'}</DialogTitle>
            </DialogHeader>
            {editingExpense && (
              <div className="space-y-4">
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