// src/components/VariableExpensesManager.tsx
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const VariableExpensesManager = () => {
  const { variable, variableAvg, saveVariable } = useBudget();

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "",
  });

  const handleAdd = () => {
    if (!form.date || !form.amount || !form.category) return;

    const newExpense = {
      id: Date.now().toString(),
      date: form.date,
      amount: Number(form.amount),
      category: form.category.trim(),
    };

    saveVariable([...variable, newExpense]);
    setForm({ date: new Date().toISOString().split("T")[0], amount: "", category: "" });
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    saveVariable(variable.filter((v) => v.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Variable Expenses</CardTitle>
            <CardDescription>Track your daily spending</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Monthly average based on habits</p>
            <p className="text-3xl font-bold text-orange-600">£{variableAvg.toFixed(0)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Últimos 10 gastos */}
        <div className="space-y-2">
          {variable.slice(-10).reverse().map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div>
                <span className="font-medium">{exp.category}</span>
                <span className="text-sm text-muted-foreground ml-3">
                  {new Date(exp.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">£{exp.amount}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(exp.id)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {variable.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No variable expenses yet. Add your first one!
            </p>
          )}
        </div>

        {/* Formulario */}
        {!isOpen ? (
          <Button onClick={() => setIsOpen(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Variable Expense
          </Button>
        ) : (
          <div className="space-y-4 border rounded-lg p-4 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (£)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="12.50"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Groceries, Coffee, Uber..."
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Save Expense</Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
