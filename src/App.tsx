// src/App.tsx
import { useState, useEffect } from "react";
import { DebtPlannerPro } from "./components/DebtPlannerPro";
import { FixedExpensesTracker } from "./components/FixedExpensesTracker";
import { VariableExpensesTracker } from "./components/VariableExpensesTracker";  // ← ESTE IMPORT FALTABA
import { SavingsEngine } from "./components/SavingsEngine";
import { OnboardingFlow } from "./components/OnboardingFlow";

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("onboarding-done");
  });

  useEffect(() => {
    if (!showOnboarding) localStorage.setItem("onboarding-done", "true");
  }, [showOnboarding]);

  return (
    <>
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <header className="text-center mb-20">
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Family Budget Planner<br />UK 2025
            </h1>
          </header>

          <div className="space-y-32">
            <DebtPlannerPro />
            <FixedExpensesTracker />
            <VariableExpensesTracker />  // ← ESTE ES EL QUE FALTABA – AHORA SÍ APARECE
            <SavingsEngine />
          </div>
        </div>
      </div>
    </>
  );
}
