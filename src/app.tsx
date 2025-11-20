// src/App.tsx
// LOVABLE: DO NOT DELETE OR REGENERATE THIS FILE – CRITICAL ROOT COMPONENT
// src/App.tsx – Main entry point for Family Budget Planner UK 2025
import { useState, useEffect } from "react"
import { DebtPlannerPro } from "./components/DebtPlannerPro"
import { FixedExpensesManager } from "./components/FixedExpensesManager"
import { VariableExpensesTracker } from "./components/VariableExpensesTracker"
import { SavingsEngine } from "./components/SavingsEngine"
import { OnboardingFlow } from "./components/OnboardingFlow"

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("onboarding_2025") !== "true"
  })

  useEffect(() => {
    if (!showOnboarding) localStorage.setItem("onboarding_2025", "true")
  }, [showOnboarding])

  return (
    <>
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <header className="text-center mb-20">
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Family Budget Planner<br />UK 2025
            </h1>
            <p className="text-2xl text-gray-700 dark:text-gray-300 mt-6">
              The most accurate financial app in the world
            </p>
          </header>

          <div className="space-y-24">
            <DebtPlannerPro />
            <FixedExpensesManager />
            <VariableExpensesTracker />
            <SavingsEngine />
          </div>

          <footer className="text-center mt-32 text-gray-500">
            Open Source • 100% Free • Made with love 2025
          </footer>
        </div>
      </div>
    </>
  )
}
