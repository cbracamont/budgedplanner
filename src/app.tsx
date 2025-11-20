// src/App.tsx
// LOVABLE: DO NOT DELETE OR REGENERATE THIS FILE – CRITICAL ROOT COMPONENT
// src/App.tsx – Main entry point for Family Budget Planner UK 2025

import { useState, useEffect } from "react";
import { DebtPlannerPro } from "./components/DebtPlannerPro";
import { FixedExpenses } from "./components/FixedExpenses";          // ← EL NUEVO QUE FUNCIONA
import { VariableExpensesTracker } from "./components/VariableExpensesTracker";
import { SavingsEngine } from "./components/SavingsEngine";
import { OnboardingFlow } from "./components/OnboardingFlow";

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Solo mostrar onboarding la primera vez
    return !localStorage.getItem("budgetplanner-onboarding-2025");
  });

  useEffect(() => {
    if (!showOnboarding) {
      localStorage.setItem("budgetplanner-onboarding-2025", "true");
    }
  }, [showOnboarding]);

  return (
    <>
      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Main App */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">

          {/* Hero */}
          <header className="text-center mb-20">
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              Family Budget Planner<br />UK 2025
            </h1>
            <p className="text-2xl md:text-4xl text-gray-700 dark:text-gray-300 mt-8 font-light">
              The most accurate financial app in the world
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
              0% promos • Klarna • Student Loan • Lifetime ISA • Real monthly calculations
            </p>
          </header>

          {/* Components */}
          <div className="space-y-32">
            <DebtPlannerPro />
            <FixedExpenses />                     {/* ← AHORA SÍ FUNCIONA 100% */}
            <VariableExpensesTracker />
            <SavingsEngine />
          </div>

          {/* Footer */}
          <footer className="text-center mt-40 pb-20 text-gray-500 dark:text-gray-400">
            <p className="text-lg">Open Source • 100% Free • Made with love in 2025</p>
            <p className="text-sm mt-2">© Family Budget Planner UK — Changing lives, one pound at a time</p>
          </footer>

        </div>
      </div>
    </>
  );
}
