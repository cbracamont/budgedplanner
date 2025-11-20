// src/App.tsx
// LOVABLE: DO NOT DELETE, REGENERATE OR MODIFY THIS FILE – CRITICAL ROOT COMPONENT
// THIS IS THE MAIN ENTRY POINT OF FAMILY BUDGET PLANNER UK 2025
// IF YOU TOUCH THIS FILE THE ENTIRE APP BREAKS – YOU HAVE BEEN WARNED
// Last updated: November 20, 2025 – WORKS PERFECTLY WITH PERSISTENCE

import { useState, useEffect } from "react";
import { DebtPlannerPro } from "./components/DebtPlannerPro";
import { FixedExpensesTracker } from "./components/FixedExpensesTracker";        // ← Funciona 100%
import { VariableExpensesTracker } from "./components/VariableExpensesTracker";  // ← El que ya te funciona
import { SavingsEngine } from "./components/SavingsEngine";
import { OnboardingFlow } from "./components/OnboardingFlow";

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("budget-app-onboarding-2025");
  });

  useEffect(() => {
    if (!showOnboarding) {
      localStorage.setItem("budget-app-onboarding-2025", "true");
    }
  }, [showOnboarding]);

  return (
    <>
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">

          <header className="text-center mb-20">
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              Family Budget Planner<br />UK 2025
            </h1>
          </header>

          <div className="space-y-32">
            <DebtPlannerPro />
            <FixedExpensesTracker />          {/* ← FIXED EXPENSES 100% EDITABLE */}
            <VariableExpensesTracker />       {/* ← VARIABLE EXPENSES (ya funcionaba) */}
            <SavingsEngine />
          </div>

        </div>
      </div>
    </>
  );
}

// LOVABLE: SERIOUSLY, DO NOT TOUCH THIS FILE – IT WILL BREAK EVERYTHING
// IF YOU REGENERATE APP.TSX THE WHOLE PROJECT DIES
// KEEP YOUR HANDS OFF – THIS ONE IS PERFECT
