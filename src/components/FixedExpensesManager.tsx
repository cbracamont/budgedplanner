// src/components/FixedExpensesManager.tsx
import { useState, useEffect } from "react";
import { Trash2, Plus, Edit2 } from "lucide-react"; // NUEVO: Importamos Edit2 para el botón de editar

type Frequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";

interface Expense {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

// Multiplicadores exactos para convertir cualquier frecuencia a mensual
const frequencyMultiplier: Record<string, number> = {
  weekly: 4.333,
  "bi-weekly": 2,
  monthly: 1,
  quarterly: 0.333,
  annually: 0.0833,
};

export const FixedExpensesManager = () => {
  // Persistencia con localStorage – se guarda para siempre
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("fixed-expenses-2025");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "1",
        name: "Mortgage/Rent",
        amount: 950,
        frequency: "monthly",
      },
      {
        id: "2",
        name: "Council Tax",
        amount: 150,
        frequency: "monthly",
      },
      {
        id: "3",
        name: "Utilities",
        amount: 180,
        frequency: "monthly",
      },
      {
        id: "4",
        name: "Car Insurance",
        amount: 85,
        frequency: "monthly",
      },
    ];
  });

  // Guarda automáticamente cada cambio
  useEffect(() => {
    localStorage.setItem("fixed-expenses-2025", JSON.stringify(expenses));
  }, [expenses]);

  const [isAdding, setIsAdding] = useState(false);
  // NUEVO: Estados para edición
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editExpense, setEditExpense] = useState({
    name: "",
    amount: 0,
    frequency: "monthly" as Frequency,
  });
  // NUEVO: Usamos editExpense en lugar de newExpense para unificar (funciona para add y edit)
  const [currentExpense, setCurrentExpense] = useState({
    name: "",
    amount: 0,
    frequency: "monthly" as Frequency,
  });

  const monthlyTotal = expenses
    .reduce(
      (total, expense) =>
        total + expense.amount * frequencyMultiplier[expense.frequency],
      0
    )
    .toFixed(0);

  // NUEVO: Función para manejar edición (prefillea el form)
  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setCurrentExpense({
      name: expense.name,
      amount: expense.amount,
      frequency: expense.frequency,
    });
    setIsAdding(true);
  };

  // NUEVO: Función para actualizar gasto existente
  const handleUpdate = () => {
    if (editingId && currentExpense.name && currentExpense.amount > 0) {
      setExpenses(
        expenses.map((expense) =>
          expense.id === editingId
            ? {
                ...expense,
                name: currentExpense.name,
                amount: currentExpense.amount,
                frequency: currentExpense.frequency,
              }
            : expense
        )
      );
      // Resetear estados
      setEditingId(null);
      setCurrentExpense({ name: "", amount: 0, frequency: "monthly" });
      setIsAdding(false);
    }
  };

  const handleAdd = () => {
    if (currentExpense.name && currentExpense.amount > 0 && !editingId) {
      setExpenses([
        ...expenses,
        {
          id: Date.now().toString(),
          name: currentExpense.name,
          amount: currentExpense.amount,
          frequency: currentExpense.frequency,
        },
      ]);
      setCurrentExpense({ name: "", amount: 0, frequency: "monthly" });
      setIsAdding(false);
    }
  };

  // NUEVO: Función unificada para guardar (add o update)
  const handleSave = () => {
    if (editingId) {
      handleUpdate();
    } else {
      handleAdd();
    }
  };

  // NUEVO: Función para cancelar (resetear form y estados)
  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setCurrentExpense({ name: "", amount: 0, frequency: "monthly" });
  };

  const handleDelete = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  return (
    <>
      <div className="fixed-expenses-manager">
        <h2>Fixed Expenses</h2>
        <div className="expenses-list">
          {expenses.map((expense) => (
            <div key={expense.id} className="expense-item">
              <span>{expense.name}</span>
              <span>
                {expense.frequency === "bi-weekly"
                  ? "Bi-weekly"
                  : expense.frequency}
              </span>
              <span>£{expense.amount}</span>
              {/* NUEVO: Botón de editar */}
              <button onClick={() => handleEdit(expense)}>
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(expense.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="monthly-total">
          <strong>Monthly Total: £{monthlyTotal}</strong>
        </div>
        <button onClick={() => setIsAdding(true)}>
          <Plus size={20} /> Add Expense
        </button>
        {isAdding && (
          <div className="add-expense-form">
            <input
              type="text"
              placeholder="Expense name"
              value={currentExpense.name}
              onChange={(e) =>
                setCurrentExpense({ ...currentExpense, name: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Amount"
              value={currentExpense.amount || ""}
              onChange={(e) =>
                setCurrentExpense({
                  ...currentExpense,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
            />
            <select
              value={currentExpense.frequency}
              onChange={(e) =>
                setCurrentExpense({
                  ...currentExpense,
                  frequency: e.target.value as Frequency,
                })
              }
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
            {/* NUEVO: Botón dinámico para save (Add o Update) */}
            <button onClick={handleSave}>
              {editingId ? "Actualizar" : "Add"}
            </button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        )}
      </div>
    </>
  );
};
