// src/App.tsx
import { Overview } from "./components/Overview";
import { FixedExpensesManager } from "./components/FixedExpensesManager";
// Si ya tienes estos componentes, descoméntalos cuando los crees/conectes
// import { VariableExpensesManager } from "./components/VariableExpensesManager";
// import { Calendar } from "./components/Calendar";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-800">Budget Planner 2025</h1>
          <p className="text-gray-600 mt-2">Todo sincronizado, todo en tiempo real</p>
        </header>

        {/* 1. Resumen general */}
        <Overview />

        {/* 2. Gastos fijos */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <FixedExpensesManager />
        </section>

        {/* 3. Gastos variables (descomenta cuando lo tengas listo) */}
        {/* <section className="bg-white rounded-xl shadow-lg p-6">
          <VariableExpensesManager />
        </section> */}

        {/* 4. Calendario (descomenta cuando lo tengas listo) */}
        {/* <section className="bg-white rounded-xl shadow-lg p-6">
          <Calendar />
        </section> */}
      </div>
    </div>
  );
}

export default App;
