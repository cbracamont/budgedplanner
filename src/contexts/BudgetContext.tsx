// src/contexts/BudgetContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Frequency = "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

export interface VariableExpense {
  id: string;
  date: string;        // YYYY-MM-DD
  amount: number;
  category: string;
  note?: string;
}

interface BudgetContextType {
  fixed: FixedExpense[];
  variable: VariableExpense[];
  income: number;

  fixedTotal: number;
  variableAvg: number;
  remaining: number;

  saveFixed: (list: FixedExpense[]) => void;
  saveVariable: (list: VariableExpense[]) => void;
  setIncome: (value: number) => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const multipliers: Record<Frequency, number> = {
  weekly: 4.333,
  "bi-weekly": 2.166,
  monthly: 1,
  quarterly: 0.333,
  annually: 0.0833,
};

export485 const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [fixed, setFixed] = useState<FixedExpense[]>(() => {
    const saved = localStorage.getItem("fixed-expenses-2025");
    return saved ? JSON.parse(saved) : [];
  });

  const [variable, setVariable] = useState<VariableExpense[]>(() => {
    const saved = localStorage.getItem("variable-expenses-2025");
    return saved ? JSON.parse(saved) : [];
  });

  const [income, setIncome] = useState<number>(() => {
    const saved = localStorage.getItem("monthly-income");
    return saved ? Number(saved) : 3500;
  });

  // Guardado automático
  useEffect(() => localStorage.setItem("fixed-expenses-2025", JSON.stringify(fixed)), [fixed]);
  useEffect(() => localStorage.setItem("variable-expenses-2025", JSON.stringify(variable)), [variable]);
  useEffect(() => localStorage.setItem("monthly-income", income.toString()), [income]);

  // Cálculos
  const fixedTotal = fixed.reduce((s, e) => s + e.amount * multipliers[e.frequency], 0);

  const last90days = new Date();
  last90days.setDate(last90days.getDate() - 90);
  const recent = variable.filter(v => new Date(v.date) >= last90days);
  const variableAvg = recent.length ? (recent.reduce((s, v) => s + v.amount, 0) / 90) * 30 : 0;

  const remaining = income - fixedTotal;

  return (
    <BudgetContext.Provider value={{
      fixed, variable, income,
      fixedTotal, variableAvg, remaining,
      saveFixed: setFixed,
      saveVariable: setVariable,
      setIncome,
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget debe usarse dentro de BudgetProvider");
  return ctx;
};
