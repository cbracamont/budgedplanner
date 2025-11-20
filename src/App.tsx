// src/App.tsx
import { Overview } from "./components/Overview";
import { FixedExpensesManager } from "./components/FixedExpensesManager";

function App() {
  return (
    <div className="container">
      <header>
        <h1>Budget Planner 2025</h1>
        <p>Todo sincronizado, todo en tiempo real</p>
      </header>

      <div className="card">
        <Overview />
      </div>

      <div className="card">
        <FixedExpensesManager />
      </div>
    </div>
  );
}

export default App;
