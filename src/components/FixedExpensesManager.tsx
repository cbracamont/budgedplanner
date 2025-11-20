// src/components/FixedExpensesManager.tsx
import { useState } from "react";
import { Trash2, Plus, Edit2, Save, X } from "lucide-react";

type Frequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

const frequencyMultiplier: Record<Frequency, number> = {
  weekly: 4.333,
  "bi-weekly": 2,
  monthly: 1,
  quarterly: 0.333,
  annually: 0.0833,
};

export const FixedExpensesManager = () => {
  const [expenses, setExpenses] = useState<FixedExpense[]>([
    { id: "1", name: "Mortgage / Rent", amount: 950, frequency: "monthly" },
    { id: "2", name: "Council Tax", amount: 150, frequency: "monthly" },
    { id: "3", name: "Utilities", amount: 180, frequency: "monthly" },
    { id: "4", name: "Car Insurance", amount: 720, frequency: "annually" },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", amount: 0, frequency: "monthly" as Frequency });

  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount * frequencyMultiplier[e.frequency], 0);

  const startEdit = (expense: FixedExpense) => {
    setEditForm({ name: expense.name, amount: expense.amount, frequency: expense.frequency });
    setEditingId(expense.id);
  };

  const saveEdit = () => {
    if (editForm.name && editForm.amount > 0) {
      setExpenses(expenses.map(e => e.id === editingId ? { ...e, ...editForm } : e));
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const editingExpense = expenses.find(e => e.id === editingId);

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl">
      <h2 className="text-3xl font-bold mb-6">Fixed Expenses</h2>
      
      <div className="space-y-4 mb-8">
        {expenses.map((expense) => (
          <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            {editingId === expense.id ? (
              // MODO EDICIÓN
              <div className="w-full flex flex-col gap-3">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Name"
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                    className="px-3 py-2 border rounded-lg w-24"
                    placeholder="Amount"
                  />
                  <select
                    value={editForm.frequency}
                    onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value as Frequency })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveEdit} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button onClick={cancelEdit} className="bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              // MODO VISUAL
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="font-semibold text-lg">{expense.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{expense.frequency}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-indigo-600">£{expense.amount}</span>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(expense)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteExpense(expense.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl text-center">
        <p className="text-2xl opacity-90">Total fixed expenses per month</p>
        <p className="text-6xl font-black mt-2">£{monthlyTotal.toFixed(0)}</p>
      </div>
    </div>
  );
};
