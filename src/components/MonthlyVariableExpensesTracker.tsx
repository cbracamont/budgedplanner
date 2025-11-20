// src/components/VariableExpensesTracker.tsx
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useVariableExpenses, useAddVariableExpense, useDeleteVariableExpense } from "@/hooks/useFinancialData";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const VariableExpensesTracker = () => {
  const { data: expenses = [], isLoading } = useVariableExpenses();
  const addExpenseMutation = useAddVariableExpense();
  const deleteExpenseMutation = useDeleteVariableExpense();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: 0,
    date: format(new Date(), "yyyy-MM-dd"),
  });

  // Calculate current month total
  const currentMonth = format(new Date(), "yyyy-MM");
  const monthlyTotal = expenses
    .filter((e) => e.date?.startsWith(currentMonth))
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

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black text-emerald-800 dark:text-emerald-300">
          Variable Expenses
        </h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl flex items-center gap-3 font-bold"
        >
          <Plus className="w-6 h-6" /> Add Expense
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {expenses.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No variable expenses yet. Add one to get started!</p>
        ) : (
          expenses.map((e) => (
            <div
              key={e.id}
              className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="text-xl font-bold">{e.name || "Unnamed expense"}</p>
                <p className="text-gray-600">£{Number(e.amount).toFixed(2)} – {e.date ? format(new Date(e.date), "MMM dd, yyyy") : "No date"}</p>
              </div>
              <button
                onClick={() => handleDelete(e.id)}
                className="text-red-600 hover:bg-red-100 p-3 rounded-lg"
                disabled={deleteExpenseMutation.isPending}
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div className="bg-emerald-50 dark:bg-gray-700 p-8 rounded-3xl border-4 border-emerald-300">
          <input
            className="w-full px-5 py-4 border rounded-xl mb-4 text-lg"
            placeholder="e.g. Groceries, Gas, Restaurant"
            value={newExpense.name}
            onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
          />
          <div className="flex gap-4">
            <input
              type="number"
              className="flex-1 px-5 py-4 border rounded-xl text-lg"
              placeholder="Amount"
              value={newExpense.amount || ""}
              onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
            />
            <input
              type="date"
              className="px-5 py-4 border rounded-xl text-lg"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            />
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleAdd}
              disabled={addExpenseMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold text-xl"
            >
              {addExpenseMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-gray-500 text-white py-4 rounded-xl font-bold text-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-12 p-10 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl text-center">
        <p className="text-3xl">Current month variable spending</p>
        <p className="text-8xl font-black">£{monthlyTotal}</p>
      </div>
    </div>
  );
};
