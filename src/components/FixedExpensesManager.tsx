// src/components/FixedExpenses.tsx
import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";

type Frequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";

interface Expense {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

const multipliers: Record<Frequency, number> = {
  weekly: 4.333,
  "bi-weekly": 2,
  monthly: 1,
  quarterly: 0.333,
  annually: 0.0833,
};

const DEFAULTS: Expense[] = [
  { id: "1", name: "Rent / Mortgage", amount: 950, frequency: "monthly" },
  { id: "2", name: "Council Tax", amount: 150, frequency: "monthly" },
  { id: "3", name: "Utilities", amount: 180, frequency: "monthly" },
  { id: "4", name: "Car Insurance", amount: 720, frequency: "annually" },
];

export const FixedExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("my-fixed-expenses-2025");
    if (saved) return JSON.parse(saved);
    return DEFAULTS;
  });

  // ← Esto es lo que hacía falta: guardar cada cambio
  useEffect(() => {
    localStorage.setItem("my-fixed-expenses-2025", JSON.stringify(expenses));
  }, [expenses]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", frequency: "monthly" as Frequency });

  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount * multipliers[e.frequency], 0).toFixed(0);

  const addExpense = () => {
    if (form.name && form.amount) {
      setExpenses([...expenses, {
        id: Date.now().toString(),
        name: form.name,
        amount: Number(form.amount),
        frequency: form.frequency,
      }]);
      setForm({ name: "", amount: "", frequency: "monthly" });
      setShowForm(false);
    }
  };

  const remove = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black text-blue-700 dark:text-blue-400">Fixed Expenses</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl flex items-center gap-2 font-bold"
        >
          <Plus className="w-6 h-6" /> Add Bill
        </button>
      </div>

      <div className="space-y-4">
        {expenses.map(e => (
          <div key={e.id} className="bg-gray-50 dark:bg-gray-700 p-5 rounded-xl flex justify-between items-center">
            <div>
              <p className="font-bold text-xl">{e.name}</p>
              <p className="text-gray-600">£{e.amount} – {e.frequency}</p>
            </div>
            <button onClick={() => remove(e.id)} className="text-red-600 hover:bg-red-100 p-3 rounded-lg">
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">New Fixed Bill</h3>
            <input
              className="w-full px-5 py-4 border-2 rounded-xl mb-4 text-lg"
              placeholder="e.g. Netflix"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <div className="flex gap-4 mb-6">
              <input
                type="number"
                className="flex-1 px-5 py-4 border-2 rounded-xl text-lg"
                placeholder="Amount"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
              <select
                className="px-5 py-4 border-2 rounded-xl text-lg"
                value={form.frequency}
                onChange={e => setForm({ ...form, frequency: e.target.value as Frequency })}
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button onClick={addExpense} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-xl">
                Save
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-xl font-bold text-xl">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl text-center">
        <p className="text-3xl opacity-90">Total fixed per month</p>
        <p className="text-7xl font-black">£{monthlyTotal}</p>
      </div>
    </div>
  );
};
