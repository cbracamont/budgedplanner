// src/App.tsx
import { useState, useEffect } from "react";
import { DebtPlannerPro } from "./components/DebtPlannerPro";
import { FixedExpensesManager } from "./components/FixedExpensesManager";
import { VariableExpensesTracker } from "./components/VariableExpensesTracker";
import { SavingsEngine } from "./components/SavingsEngine";
import { OnboardingFlow } from "./components/OnboardingFlow";

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Solo mostrar onboarding la primera vez
    return localStorage.getItem("onboarding_completed") !== "true";
  });

  useEffect(() => {
    if (!showOnboarding) {
      localStorage.setItem("onboarding_completed", "true");
    }
  }, [showOnboarding]);

  return (
    <>
      {/* Onboarding overlay */}
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

      {/* Main App */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero Header */}
          <header className "text-center mb-20">
            <h1 className="text-5xl md:text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              Family Budget Planner<br />UK 2025
            </h1>
            <p className="text-xl md:text-3xl text-gray-700 dark:text-gray-300 mt-6 font-light">
              The most accurate, honest and beautiful financial app in the world
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
              0% promos • Klarna • Student Loan • Lifetime ISA • Real monthly calculations
            </p>
          </header>

          {/* Main Sections */}
          <div className="space-y-24">
            <DebtPlannerPro />
            <FixedExpensesManager />
            <VariableExpensesTracker />
            <SavingsEngine />
          </div>

          {/* Footer */}
          <footer className="text-center mt-32 pb-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Open Source • 100% Free • Made with love and surgical precision in 2025
            </p>
            <p className="text-sm text-gray-500 mt-4">
              © 2025 Family Budget Planner UK — Changing lives, one pound at a time
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
