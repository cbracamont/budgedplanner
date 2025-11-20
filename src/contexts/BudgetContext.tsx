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
  date: string;      // "2025-11-20"
  amount: number;
  category: string;
}

interface BudgetData {
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  monthlyIncome: number;
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
  setIncome: (n: number) => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const multipliers: Record<Frequency, number> = {
  weekly: 4.333,
  "bi-weekly": 2.166,
  monthly: 1,
  quarterly: 0.333,
  annually: 0.0833,
};

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<BudgetData>(() => {
    const fixed = localStorage.getItem("fixed-expenses-2025");
    const variable = localStorage.getItem("variable-expenses-2025") || "[]";
    const income = localStorage.getItem("monthly-income") || "3500";

    return {
      fixedExpenses: fixed ? JSON.parse(fixed) : [],
      variableExpenses: JSON.parse(variable),
      monthlyIncome: Number(income),
    };
  });

  // Guardado automático
  useEffect(() => {
    localStorage.setItem("fixed-expenses-2025", JSON.stringify(data.fixedExpenses));
  }, [data.fixedExpenses]);

  useEffect(() => {
    localStorage.setItem("variable-expenses-2025", JSON.stringify(data.variableExpenses));
  }, [data.variableExpenses]);

  useEffect(() => {
    localStorage.setItem("monthly-income", data.monthlyIncome.toString());
  }, [data.monthlyIncome]);

  // Cálculos
  const fixedTotal = data.fixedExpenses.reduce(
    (sum, e) => sum + e.amount * multipliers[e.frequency],
    0
  );

  // Promedio variable últimos 90 días
  const days90 = new Date();
  days90.setDate(days90.getDate() - 90);
  const recent = data.variableExpenses.filter(v => new Date(v.date) >= days90);
  const variableAvg = recent.length
    ? (recent.reduce((s, v) => s + v.amount, 0) / 90) * 30
    : 0;

  const remaining = data.monthlyIncome - fixedTotal;

  return (
    <BudgetContext.Provider value={{
      fixed: data.fixedExpenses,
      variable: data.variableExpenses,
      income: data.monthlyIncome,
      fixedTotal,
      variableAvg,
      remaining,
      saveFixed: (list) => setData(d => ({ ...d, fixedExpenses: list })),
      saveVariable: (list) => setData(d => ({ ...d, variableExpenses: list })),
      setIncome: (n) => setData(d => ({ ...d, monthlyIncome: n })),
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget fuera del provider");
  return ctx;
};
