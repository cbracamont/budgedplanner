// src/components/OnboardingFlow.tsx
import { useState } from "react";

type Props = {
  onComplete: () => void;
};

export const OnboardingFlow = ({ onComplete }: Props) => {
  const [step, setStep] = useState(1);

  if (step > 3) {
    onComplete();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 max-w-md w-full text-center shadow-2xl">
        <h1 className="text-4xl md:text-5xl font-black mb-8">
          {step === 1 && "¡Bienvenido!"}
          {step === 2 && "Añade tus ingresos"}
          {step === 3 && "¡Todo listo!"}
        </h1>
        <button
          onClick={() => setStep(step + 1)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 rounded-2xl text-2xl font-bold hover:scale-105 transition"
        >
          {step === 3 ? "¡Empezar ahora!" : "Continuar"}
        </button>
      </div>
    </div>
  );
};
