// src/components/DebtPlannerPro.tsx
import { useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Line } from "react-chartjs-2";
import jsPDF from "jspdf";
import { AlertCircle, Flame, Snowflake } from "lucide-react";

export const DebtPlannerPro = () => {
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [applySurplus, setApplySurplus] = useState(true);

  const { data: rawDebts = [], isLoading, error } = useQuery({ queryKey: ["debts"] });
  const { cashFlow = 0, monthlySavings = 0 } = { cashFlow: 400, monthlySavings: 200 }; // placeholder

  if (error) return <div className="text-red-500">Error loading debts</div>;
  if (isLoading) return <div>Loading...</div>;

  const debts = (rawDebts || []).filter(d => d?.balance > 0);
  const surplus = applySurplus ? Math.max(0, cashFlow - monthlySavings) : 0;

  const projection = useMemo(() => {
    if (debts.length === 0) return null;
    let totalInterest = 0, months = 0;
    const history = [];
    let working = debts.map(d => ({ ...d, remaining: d.balance || 0 }));

    while (working.some(d => d.remaining > 0.01) && months < 600) {
      months++;
      working.sort((a, b) => strategy === "avalanche" 
        ? (b.apr || 0) - (a.apr || 0) 
        : a.remaining - b.remaining
      );

      working.forEach((debt, i) => {
        const apr = debt.promotional_months >= months ? (debt.promotional_apr || 0) : (debt.apr || 0);
        const interest = debt.remaining * (apr / 100 / 12);
        totalInterest += interest;
        debt.remaining += interest;

        let payment = debt.installment_months >= months 
          ? (debt.installment_amount || debt.balance / debt.installment_months)
          : (debt.minimum_payment || 25);

        if (i === 0 && surplus > 0) payment += surplus;
        debt.remaining = Math.max(0, debt.remaining - payment);
      });

      history.push({ month: months, debtLeft: working.reduce((s, d) => s + d.remaining, 0) });
    }

    return { monthsToFreedom: months, totalInterest: Math.round(totalInterest), history };
  }, [debts, strategy, surplus]);

  if (!projection) return <div className="text-green-600 text-2xl">You're debt-free!</div>;

  const chartData = {
    labels: projection.history.map((_, i) => `Month ${i + 1}`),
    datasets: [{ label: "Debt", data: projection.history.map(h => h.debtLeft), borderColor: "#ef4444", fill: true }],
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Debt Freedom Plan", 20, 20);
    doc.text(`Strategy: ${strategy.toUpperCase()}`, 20, 40);
    doc.text(`Debt-free in: ${projection.monthsToFreedom} months`, 20, 60);
    doc.text(`Interest paid: £${projection.totalInterest.toLocaleString()}`, 20, 80);
    doc.save("debt-plan.pdf");
    toast.success("PDF downloaded!");
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button onClick={() => setStrategy("avalanche")} className={strategy === "avalanche" ? "font-bold" : ""}>
          Avalanche
        </button>
        <button onClick={() => setStrategy("snowball")} className={strategy === "snowball" ? "font-bold" : ""}>
          Snowball
        </button>
      </div>
      <Line data={chartData} />
      <div className="text-3xl font-bold text-green-600">
        Debt-free in {projection.monthsToFreedom} months!
      </div>
      <button onClick={exportPDF} className="bg-blue-600 text-white px-6 py-3 rounded">
        Download PDF Plan
      </button>
    </div>
  );
};
