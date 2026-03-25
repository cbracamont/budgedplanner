import { useState } from "react";
import { Trash2, Plus, Pencil, Check, X } from "lucide-react";
import { useVariableExpenses, useAddVariableExpense, useUpdateVariableExpense, useDeleteVariableExpense } from "@/hooks/useFinancialData";
import { format } from "date-fns";

export const VariableExpensesTracker = () => {
  const { data: expenses = [], isLoading } = useVariableExpenses();
  const addExpenseMutation = useAddVariableExpense();
  const updateExpenseMutation = useUpdateVariableExpense();
  const deleteExpenseMutation = useDeleteVariableExpense();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: 0,
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const currentMonth = format(new Date(), "yyyy-MM");
  const currentMonthExpenses = expenses.filter((e) => e.date?.startsWith(currentMonth));
  const monthlyTotal = currentMonthExpenses
    .reduce((t, e) => t + Number(e.amount), 0)
    .toFixed(0);

  const handleAdd = async () => {
    if (newExpense.name && newExpense.amount > 0) {
      try {
        await addExpenseMutation.mutateAsync({
          name: newExpense.name,
          amount: newExpense.amount,
        });
        setNewExpense({ name: "", amount: 0, date: format(new Date(), "yyyy-MM-dd") });
        setIsAdding(false);
      } catch (error) {
        console.error("Error adding expense:", error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpenseMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const startEdit = (expense: { id: string; amount: number }) => {
    setEditingId(expense.id);
    setEditAmount(Number(expense.amount).toFixed(2));
  };

  const saveEdit = async (id: string, name: string) => {
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      setEditingId(null);
      return;
    }
    try {
      await updateExpenseMutation.mutateAsync({ id, name, amount: newAmount });
      setEditingId(null);
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="bg-card p-10 rounded-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black text-primary">
          Variable Expenses
        </h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-4 rounded-xl flex items-center gap-3 font-bold"
        >
          <Plus className="w-6 h-6" /> Add Expense
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {expenses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No variable expenses yet. Add one to get started!</p>
        ) : (
          expenses.map((e) => (
            <div
              key={e.id}
              className="bg-muted p-6 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="text-xl font-bold">{e.name || "Unnamed expense"}</p>
                {editingId === e.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground">£</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(ev) => setEditAmount(ev.target.value)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") saveEdit(e.id, e.name || "");
                        if (ev.key === "Escape") cancelEdit();
                      }}
                      className="w-28 px-2 py-1 border rounded-md text-lg bg-background"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(e.id, e.name || "")}
                      className="text-primary hover:bg-primary/10 p-1 rounded"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">£{Number(e.amount).toFixed(2)} – {e.date ? format(new Date(e.date), "MMM dd, yyyy") : "No date"}</p>
                )}
              </div>
              <div className="flex gap-1">
                {editingId !== e.id && (
                  <button
                    onClick={() => startEdit(e)}
                    className="text-primary hover:bg-primary/10 p-3 rounded-lg"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-destructive hover:bg-destructive/10 p-3 rounded-lg"
                  disabled={deleteExpenseMutation.isPending}
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div className="bg-accent p-8 rounded-3xl border-4 border-primary/30">
          <input
            className="w-full px-5 py-4 border rounded-xl mb-4 text-lg bg-background"
            placeholder="e.g. Groceries, Gas, Restaurant"
            value={newExpense.name}
            onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
          />
          <div className="flex gap-4">
            <input
              type="number"
              className="flex-1 px-5 py-4 border rounded-xl text-lg bg-background"
              placeholder="Amount"
              value={newExpense.amount || ""}
              onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
            />
            <input
              type="date"
              className="px-5 py-4 border rounded-xl text-lg bg-background"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            />
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleAdd}
              disabled={addExpenseMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground py-4 rounded-xl font-bold text-xl"
            >
              {addExpenseMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-muted text-foreground py-4 rounded-xl font-bold text-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-12 p-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-3xl text-center">
        <p className="text-3xl">Current month variable spending</p>
        <p className="text-8xl font-black">£{monthlyTotal}</p>
      </div>
    </div>
  );
};
