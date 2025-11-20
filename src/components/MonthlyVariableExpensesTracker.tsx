// src/components/VariableExpensesTracker.tsx
import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";

type Frequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";

interface Expense {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

const multiplier: Record<Frequency, number> = {
  weekly: 4.333,
  "bi-weekly": 2,
  monthly: 1,
  quarterly: 0.333,
  annually: 0.0833,
};

export const VariableExpensesTracker = () => {
  // ← AQUÍ ESTÁ LA CLAVE: ahora se guarda para siempre
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("variable-expenses-2025");
    if (saved) return JSON.parse(saved);
    return [
      { id: "v1", name: "Groceries", amount: 320, frequency: "monthly" },
      { id: "v2", name: "Eating out", amount: 180, frequency: "monthly" },
      { id: "v3", name: "Fuel / Transport", amount: 140, frequency: "monthly" },
      { id: "v4", name: "Entertainment", amount: 120, frequency: "monthly" },
    ];
  });

  // Guarda cada cambio automáticamente
  useEffect(() => {
    localStorage.setItem("variable-expenses-2025", JSON.stringify(expenses));
  }, [expenses]);

  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: 0,
    frequency: "monthly" as Frequency,
  });

  const monthlyTotal = expenses
    .reduce((t, e) => t + e.amount * multiplier[e.frequency], 0)
    .toFixed(0);

  const add = () => {
    if (newExpense.name && newExpense.amount > 0) {
      setExpenses([...expenses, { id: Date.now().toString(), ...newExpense }]);
      setNewExpense({ name: "", amount: 0, frequency: "monthly" });
      setIsAdding(false);
    }
  };

  const remove = (id: string) => setExpenses(expenses.filter((e) => e.id !== id));

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
        {expenses.map((e) => (
          <div
            key={e.id}
            className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl flex justify-between items-center"
          >
            <div>
              <p className="text-xl font-bold">{e.name}</p>
              <p className="text-gray-600">£{e.amount} – {e.frequency}</p>
            </div>
            <button
              onClick={() => remove(e.id)}
              className="text-red-600 hover:bg-red-100 p-3 rounded-lg"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="bg-emerald-50 dark:bg-gray-700 p-8 rounded-3xl border-4 border-emerald-300">
          <input
            className="w-full px-5 py-4 border rounded-xl mb-4 text-lg"
            placeholder="e.g. Netflix, Gym, Coffee"
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
            <select
              className="px-5 py-4 border rounded-xl text-lg"
              value={newExpense.frequency}
              onChange={(e) =>
                setNewExpense({ ...newExpense, frequency: e.target.value as Frequency })
              }
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={add}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-xl"
            >
              Save
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
        <p className="text-3xl">Average monthly variable spending</p>
        <p className="text-8xl font-black">£{monthlyTotal}</p>
      </div>
    </div>
  );
};
