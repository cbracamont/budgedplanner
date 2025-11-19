// src/components/DebtPlannerPro.tsx
import { useState } from "react";

export const DebtPlannerPro = () => {
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");

  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-700 text-white p-10 rounded-3xl text-center shadow-2xl">
      <h2 className="text-5xl font-black mb-6">
        Serás libre de deudas en <span className="text-yellow-300">18 meses</span>
      </h2>
      <p className="text-2xl mb-8 opacity-90">
        Estrategia {strategy === "avalanche" ? "Avalanche" : "Snowball"} activa
      </p>

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

      <div className="text-7xl font-black mb-4">£487</div>
      <p className="text-xl opacity-90">en intereses (vs £2.104 sin estrategia)</p>

      <button className="mt-10 bg-yellow-400 text-purple-900 px-10 py-5 rounded-2xl text-2xl font-bold hover:scale-105 transition">
        Descargar Plan Completo (PDF)
      </button>

      <div className="mt-8 text-sm opacity-70">Soporta: 0% promos • Klarna • Student Loan Plan 5 • Overdraft 39.9%</div>
    </div>
  );
};
