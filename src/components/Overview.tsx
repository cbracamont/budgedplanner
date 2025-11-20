// src/components/Overview.tsx
import { useBudget } from "../contexts/BudgetContext";

export const Overview = () => {
  const { income, fixedMonthlyTotal, variableMonthlyAverage, remainingAfterFixed } = useBudget();

  return (
    <>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        Resumen Mensual
      </h2>
      <div className="grid">
        <div className="summary-item">
          <h3>Ingreso</h3>
          <p className="income">£{income.toLocaleString()}</p>
        </div>
        <div className="summary-item">
          <h3>Fijos</h3>
          <p className="fixed">£{fixedMonthlyTotal.toFixed(0)}</p>
        </div>
        <div className="summary-item">
          <h3>Variable (promedio)</h3>
          <p className="variable">£{variableMonthlyAverage.toFixed(0)}</p>
        </div>
        <div className="summary-item">
          <h3>Restante tras fijos</h3>
          <p className="remaining">£{remainingAfterFixed.toFixed(0)}</p>
        </div>
      </div>
    </>
  );
};
