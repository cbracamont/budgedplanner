// src/components/FixedExpensesManager.tsx
import { useState } from "react";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { useBudget } from "../contexts/BudgetContext";

type Frequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";

export const FixedExpensesManager = () => {
  const { fixedExpenses, fixedMonthlyTotal, addFixedExpense, updateFixedExpense, deleteFixedExpense } = useBudget();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", amount: 0, frequency: "monthly" as Frequency });

  const handleEdit = (exp: typeof fixedExpenses[0]) => {
    setForm({ name: exp.name, amount: exp.amount, frequency: exp.frequency });
    setEditingId(exp.id);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!form.name || form.amount <= 0) return;

    if (editingId) {
      updateFixedExpense(editingId, { name: form.name, amount: form.amount, frequency: form.amount });
    } else {
      addFixedExpense({ name: form.name, amount: form.amount, frequency: form.frequency });
    }

    setForm({ name: "", amount: 0, frequency: "monthly" });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({ name: "", amount: 0, frequency: "monthly" });
  };

  return (
    <div className="fixed-expenses-manager">
      <h2>Fixed Expenses</h2>

      <div className="expenses-list">
        {fixedExpenses.map((exp) => (
          <div key={exp.id} className="expense-item">
            <span>{exp.name}</span>
            <span>{exp.frequency === "bi-weekly" ? "Bi-weekly" : exp.frequency}</span>
            <span>£{exp.amount}</span>
            <button onClick={() => handleEdit(exp)}><Edit2 size={16} /></button>
            <button onClick={() => deleteFixedExpense(exp.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <div className="monthly-total">
        <strong>Monthly Fixed Total: £{fixedMonthlyTotal.toFixed(0)}</strong>
      </div>

      {!isAdding ? (
        <button onClick={() => setIsAdding(true)}>
          <Plus size={20} /> Add Fixed Expense
        </button>
      ) : (
        <div className="add-form">
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input type="number" placeholder="Amount" value={form.amount || ""} onChange={e => setForm({ ...form, amount: +e.target.value })} />
          <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value as Frequency })}>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
          <button onClick={handleSave}>{editingId ? "Update" : "Add"}</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
};
