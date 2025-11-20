// src/components/DebtPlannerPro.tsx
import { useState } from "react";

export const DebtPlannerPro = () => {
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [debts] = useState([
    { name: "Credit Card", balance: 5000, apr: 19.9, promoMonths: 12, minPayment: 150 },
  ]);
  const monthlySurplus = 350; // Placeholder – replace with real hook

  // Simple calculation (expand later)
  const monthsToFreedom = Math.ceil(
    debts.reduce((total, d) => total + d.balance, 0) / (monthlySurplus + debts.reduce((s, d) => s + d.minPayment, 0))
  );
  const totalInterest = Math.round(debts.reduce((total, d) => total + (d.balance * (d.apr / 100 / 12 * monthsToFreedom)), 0));

  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-700 text-white p-10 rounded-3xl text-center shadow-2xl">
      <h2 className="text-5xl font-black mb-6">
        Debt-free in <span className="text-yellow-300">{monthsToFreedom} months</span>
      </h2>
      <p className="text-2xl mb-8 opacity-90">Strategy: {strategy}</p>
      <div className="flex justify-center gap-6 mb-10">
        <button
          onClick={() => setStrategy("avalanche")}
          className={`px-8 py-4 rounded-2xl text-xl font-bold transition-all ${
            strategy === "avalanche" ? "bg-white text-purple-700 scale-110" : "bg-white/20 hover:bg-white/40"
          }`}
        >
          Avalanche
        </button>
        <button
          onClick={() => setStrategy("snowball")}
          className={`px-8 py-4 rounded-2xl text-xl font-bold transition-all ${
            strategy === "snowball" ? "bg-white text-purple-700 scale-110" : "bg-white/20 hover:bg-white/40"
          }`}
        >
          Snowball
        </button>
      </div>
      <div className="text-7xl font-black mb-4">£{totalInterest}</div>
      <p className="text-xl opacity-90">in interest (with your surplus)</p>
      <button className="mt-10 bg-yellow-400 text-purple-900 px-10 py-5 rounded-2xl text-2xl font-bold hover:scale-105 transition">
        Download Full Plan (PDF)
      </button>
    </div>
  );
};
