// src/contexts/BudgetContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Frequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

export interface VariableExpense {
  id: string;
  date: string;        // formato: "2025-11-20"
  category: string;
  amount: number;
  note?: string;
}

interface BudgetContextType {
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  income: number;

  setFixedExpenses: (expenses: FixedExpense[]) => void;
  addFixedExpense: (expense: Omit<FixedExpense, "id">) => void;
  updateFixedExpense: (id: string, data: Partial<FixedExpense>) => void;
  deleteFixedExpense: (id: string) => void;

  addVariableExpense: (expense: Omit<VariableExpense, "id">) => void;
  deleteVariableExpense: (id: string) => void;

  setIncome: (income: number) => void;

  // Cálculos automáticos
  fixedMonthlyTotal: number;
  variableMonthlyAverage: number;
  totalMonthlyOutgo: number;
  remainingAfterFixed: number;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const frequencyMultiplier: Record<Frequency, number> = {
  weekly: 4.333,
  "bi-weekly": 2.166,
  monthly: 1,
  quarterly: 0.333,
  annually: 0.0833,
};

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  // USAMOS TU CLAVE ANTIGUA: "fixed-expenses-2025" ← aquí están tus datos reales
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => {
    const saved = localStorage.getItem("fixed-expenses-2025");
    return saved ? JSON.parse(saved) : [];
  });

  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>(() => {
    const saved = localStorage.getItem("variable-expenses-2025");
    return saved ? JSON.parse(saved) : [];
  });

  const [income, setIncome] = useState<number>(() => {
    const saved = localStorage.getItem("monthly-income-2025");
    return saved ? Number(saved) : 3500;
  });

  // Guardado automático
  useEffect(() => {
    localStorage.setItem("fixed-expenses-2025", JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem("variable-expenses-2025", JSON.stringify(variableExpenses));
  }, [variableExpenses]);

  useEffect(() => {
    localStorage.setItem("monthly-income-2025", income.toString());
  }, [income]);

  // Cálculo del total fijo mensual
  const fixedMonthlyTotal = fixedExpenses.reduce(
    (sum, e) => sum + e.amount * frequencyMultiplier[e.frequency],
    0
  );

  // Promedio variable (últimos 90 días proyectado a mensual)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recent = variableExpenses.filter(v => new Date(v.date) >= ninetyDaysAgo);
  const variableMonthlyAverage = recent.length > 0
    ? (recent.reduce((s, v) => s + v.amount, 0) * 30) / 90
    : 0;

  const totalMonthlyOutgo = fixedMonthlyTotal + variableMonthlyAverage;
  const remainingAfterFixed = income - fixedMonthlyTotal;

  // Helpers
  const addFixedExpense = (exp: Omit<FixedExpense, "id">) => {
    setFixedExpenses(prev => [...prev, { ...exp, id: Date.now().toString() }]);
  };

  const updateFixedExpense = (id: string, data: Partial<FixedExpense>) => {
    setFixedExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addVariableExpense = (exp: Omit<VariableExpense, "id">) => {
    setVariableExpenses(prev => [...prev, { ...exp, id: Date.now().toString() }]);
  };

  const deleteVariableExpense = (id: string) => {
    setVariableExpenses(prev => prev.filter(v => v.id !== id));
  };

  return (
    <BudgetContext.Provider value={{
      fixedExpenses, variableExpenses, income,
      setFixedExpenses, addFixedExpense, updateFixedExpense, deleteFixedExpense,
      addVariableExpense, deleteVariableExpense, setIncome,
      fixedMonthlyTotal, variableMonthlyAverage, totalMonthlyOutgo, remainingAfterFixed
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) throw new Error("useBudget debe usarse dentro de BudgetProvider");
  return context;
};
