// src/App.tsx
import { useState } from "react";
import { DebtPlannerPro } from "./components/DebtPlannerPro";
import { FixedExpensesManager } from "./components/FixedExpensesManager";
import { SavingsEngine } from "./components/SavingsEngine";
import { OnboardingFlow } from "./components/OnboardingFlow";

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-800">
        {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

        <div className="max-w-6xl mx-auto px-6 py-12">
          <header className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Family Budget Planner UK 2025
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mt-6">
              The most accurate financial app in the world
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
              0% promos • Klarna • Student Loan • Lifetime ISA • Notifications
            </p>
          </header>

          <div className="space-y-16">
            <DebtPlannerPro />
            <FixedExpensesManager />
            <SavingsEngine />
          </div>

          <footer className="text-center mt-20 text-gray-500 dark:text-gray-400">
            <p className="text-sm">Made with love and surgical precision in 2025</p>
            <p className="text-xs mt-2">Open Source • 100% Free • Forever</p>
          </footer>
        </div>
      </div>
    </>
  );
}
