// src/components/FixedExpensesManager.tsx
import { useState } from "react";
import { format, getMonth, getYear } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Calendar, PoundSterling } from "lucide-react";

type Frequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  day_of_month?: number;
  start_date: string;
}

const frequencyMultiplier: Record<Frequency, number> = {
  weekly: 4.333,
  "bi-weekly": 2,
  monthly: 1,
  quarterly: 0.333,
  annually: 0.0833,
};

export const FixedExpensesManager = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<FixedExpense>>({
    name: "",
    amount: 0,
    frequency: "monthly",
    day_of_month: 1,
    start_date: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: expenses = [] } = useQuery<FixedExpense[]>({
    queryKey: ["fixed_expenses"],
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: async (expense: FixedExpense) => {
      // Replace with real Supabase call
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed_expenses"] });
      toast.success("Fixed expense saved");
      setIsAdding(false);
      setEditingId(null);
      setForm({
        name: "",
        amount: 0,
        frequency: "monthly",
        day_of_month: 1,
        start_date: format(new Date(), "yyyy-MM-dd"),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed_expenses"] });
      toast.success("Expense deleted");
    },
  });

  // ACCURATE MONTHLY TOTAL BY FREQUENCY
  const getMonthlyTotal = () => {
    const today = new Date();
    const currentMonth = getMonth(today);
    const currentYear = getYear(today);

    return expenses.reduce((total, expense) => {
      const startDate = new Date(expense.start_date);
      if (startDate > today) return total;

      let monthlyAmount = 0;

      switch (expense.frequency) {
        case "weekly":
          monthlyAmount = expense.amount * frequencyMultiplier.weekly;
          break;
        case "bi-weekly":
          monthlyAmount = expense.amount * frequencyMultiplier["bi-weekly"];
          break;
        case "monthly":
          monthlyAmount = expense.amount;
          break;
        case "quarterly":
          const startMonth = getMonth(startDate);
          const startYear = getYear(startDate);
          const monthsSinceStart = (currentYear - startYear) * 12 + (currentMonth - startMonth);
          if (monthsSinceStart % 3 === 0) {
            monthlyAmount = expense.amount;
          }
          break;
        case "annually":
          if (currentMonth === getMonth(startDate)) {
            monthlyAmount = expense.amount;
          }
          break;
      }

      return total + monthlyAmount;
    }, 0);
  };

  const monthlyTotal = getMonthlyTotal();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fixed Expenses</h2>
          <p className="text-gray-600">
            Estimated monthly total:{" "}
            <span className="text-3xl font-black text-emerald-600">£{monthlyTotal.toFixed(0)}</span>
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" /> Add expense
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border">
          <h3 className="text-xl font-semibold mb-4">{editingId ? "Edit" : "New"} fixed expense</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name (e.g. Mortgage)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-3 border rounded-xl"
            />
            <div className="flex items-center gap-2">
              <PoundSterling className="w-5 h-5 text-gray-500" />
              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="px-4 py-3 border rounded-xl flex-1"
              />
            </div>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
              className="px-4 py-3 border rounded-xl"
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="px-4 py-3 border rounded-xl"
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => mutation.mutate(form as FixedExpense)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="bg-gray-300 px-6 py-3 rounded-xl hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {expenses.length === 0 ? (
          <p className="text-center text-gray-500 py-12">You have no fixed expenses yet</p>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl border flex justify-between items-center"
            >
              <div>
                <h4 className="font-semibold text-lg">{expense.name}</h4>
                <p className="text-gray-600">
                  £{expense.amount.toFixed(0)} •{" "}
                  {expense.frequency === "bi-weekly"
                    ? "Bi-weekly"
                    : expense.frequency === "weekly"
                      ? "Weekly"
                      : expense.frequency === "quarterly"
                        ? "Quarterly"
                        : expense.frequency === "annually"
                          ? "Annually"
                          : "Monthly"}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingId(expense.id)}
                  className="text-blue-600 hover:bg-blue-50 p-3 rounded-xl"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(expense.id)}
                  className="text-red-600 hover:bg-red-50 p-3 rounded-xl"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
