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
        const apr = debt.promotional_months >= months ? (debt.promotional_apr || 0) : (debt.ap
