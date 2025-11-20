// src/components/FixedExpensesManager.tsx
import { useState } from "react";
import { Trash2, PlusCircle } from "lucide-react";

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

export const FixedExpensesManager = () => {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "1", name: "Rent/Mortgage", amount: 950, frequency: "monthly" },
    { id: "2", name: "Council Tax", amount: 150, frequency: "monthly" },
    { id: "3", name: "Utilities", amount: 180, frequency: "monthly" },
    { id: "4", name: "Car Insurance", amount: 720, frequency: "annually" },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", frequency: "monthly" as Frequency });

  const monthlyTotal = expenses
    .reduce((sum, e) => sum + e.amount * multipliers[e.frequency], 0)
    .toFixed(0);

  const addOrUpdateExpense = () => {
    if (!form.name || !form.amount) return;

    const newExpense = {
      id: Date.now().toString(),
      name: form.name,
      amount: Number(form.amount),
      frequency: form.frequency,
    };

    setExpenses([...expenses, newExpense]);
    setForm({ name: "", amount: "", frequency: "monthly" });
    setShowForm(false);
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Fixed Expenses</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition"
        >
          <PlusCircle className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      <div className="space-y-4">
        {expenses.map((exp) => (
          <div key={exp.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-5 rounded-xl">
            <div>
              <p className="font-semibold text-lg">{exp.name}</p>
              <p className="text-sm text-gray-500">
                £{exp.amount} – {exp.frequency}
              </p>
            </div>
            <button
              onClick={() => removeExpense(exp.id)}
              className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 p-3 rounded-lg transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Formulario flotante */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">New Fixed Expense</h3>
            <input
              type="text"
              placeholder="Name (e.g. Netflix)"
              className="w-full px-4 py-3 border rounded-xl mb-4"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="flex gap-4 mb-4">
              <input
                type="number"
                placeholder="Amount"
                className="flex-1 px-4 py-3 border rounded-xl"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <select
                className="px-4 py-3 border rounded-xl"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button
                onClick={addOrUpdateExpense}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition"
              >
                Save Expense
              </button>
              <button
                onClick={() => { setShowForm(false); setForm({ name: "", amount: "", frequency: "monthly" }); }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl text-center">
        <p className="text-2xl opacity-90">Total fixed expenses per month</p>
        <p className="text-6xl font-black mt-2">£{monthlyTotal}</p>
      </div>
    </div>
  );
};
