// src/components/FixedExpensesManager.tsx
import { useState } from "react";

export const FixedExpensesManager = () => {
  const expenses = [
    { name: "Mortgage/Rent", amount: 950 },
    { name: "Council Tax", amount: 150, frequency: "monthly" },
    { name: "Utilities", amount: 180 },
    { name: "Car Insurance", amount: 85 },
  ];

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl">
      <h2 className="text-3xl font-bold mb-6">Fixed Expenses</h2>
      <div className="space-y-4">
        {expenses.map((e, i) => (
          <div key={i} className="flex justify-between text-lg">
            <span>{e.name}</span>
            <span className="font-semibold">£{e.amount}</span>
          </div>
        ))}
      </div>
      <div className="border-t-2 border-gray-300 mt-6 pt-6 text-3xl font-black text-emerald-600">
        Total: £{total} / month
      </div>
    </div>
  );
};
