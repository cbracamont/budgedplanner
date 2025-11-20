// src/components/Overview.tsx
import { useBudget } from "../contexts/BudgetContext";

export const Overview = () => {
  const { income, fixedMonthlyTotal, variableMonthlyAverage, remainingAfterFixed } = useBudget();

  return (
    <div className="overview">
      <h2>Resumen Mensual</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card"><h3>Ingreso</h3><p>£{income}</p></div>
        <div className="card"><h3>Fijos</h3><p className="text-red-600">£{fixedMonthlyTotal.toFixed(0)}</p></div>
        <div className="card"><h3>Variable (promedio)</h3><p>£{variableMonthlyAverage.toFixed(0)}</p></div>
        <div className="card"><h3>Restante tras fijos</h3><p className="text-green-600 font-bold">£{remainingAfterFixed.toFixed(0)}</p></div>
      </div>
    </div>
  );
};
