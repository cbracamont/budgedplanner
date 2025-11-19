// src/components/OnboardingFlow.tsx
import { useState } from "react";

export const OnboardingFlow = () => {
  const [step, setStep] = useState(1);

  if (step > 3) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 max-w-lg">
        <h1 className="text-4xl font-bold text-center mb-8">
          {step === 1 && "Welcome!"}
          {step === 2 && "Add your income"}
          {step === 3 && "You're ready!"}
        </h1>
        <button 
          onClick={() => setStep(step + 1)}
          className="w-full bg-blue-600 text-white py-4 rounded-xl text-xl"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};
