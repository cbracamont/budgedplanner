// src/components/FixedExpensesManager.tsx
import { useState } from "react";
import { Trash2, Plus, Edit2 } from "lucide-react";

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
    { id: "3", name: "Utilities (Gas + Electric)", amount: 180, frequency: "monthly" },
    { id: "4", name: "Internet + TV", amount: 65, frequency: "monthly" },
    { id: "5", name: "Car Insurance", amount: 720, frequency: "annually" },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", amount: 0, frequency: "monthly" as Frequency });

  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount * frequencyMultiplier[e.frequency], 0);

  const handleSave = () => {
    if (form.name && form.amount > 0) {
      if (editingId) {
        setExpenses(expenses.map(e => e.id === editingId ? { ...e, ...form } : e));
        setEditingId(null);
      } else {
        setExpenses([...expenses, { id: Date.now().toString(), ...form }]);
      }
      setForm({ name: "", amount: 0, frequency: "monthly" });
      setIsAdding(false);
    }
  };

  const handleEdit = (expense: FixedExpense) => {
    setForm({ name: expense.name, amount: expense.amount, frequency: expense.frequency });
    setEditingId(expense.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">Fixed Expenses</h2>
          <p className="text-gray-600 dark:text-gray-400">Monthly total (all frequencies converted)</p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setEditingId(null); setForm({ name: "", amount: 0, frequency: "monthly" }); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Expense
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {expenses.map((expense) => (
          <div key={expense.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div>
              <p className="font-semibold text-lg">{expense.name}</p>
              <p className="text-sm text-gray-500">
                £{expense.amount} • {expense.frequency === "bi-weekly" ? "Bi-weekly" : expense.frequency}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleEdit(expense)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg">
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario */}
      {isAdding && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 p-6 rounded-2xl border">
          <h3 className="text-xl font-bold mb-4">{editingId ? "Edit" : "New"} Fixed Expense</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <input type="text" placeholder="Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-3 border rounded-xl" />
            <input type="number" placeholder="Amount" value={form.amount || ""}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className="px-4 py-3 border rounded-xl" />
            <select value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
              className="px-4 py-3 border rounded-xl">
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold">
              {editingId ? "Update" : "Save"}
            </button>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-xl font-bold">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl text-center">
        <p className="text-2xl opacity-90">Total fixed expenses per month</p>
        <p className="text-6xl font-black mt-2">£{monthlyTotal.toFixed(0)}</p>
      </div>
    </div>
  );
};
