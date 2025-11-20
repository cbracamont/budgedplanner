// src/main.tsx  (o donde esté el ReactDOM.createRoot)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BudgetProvider } from "./contexts/BudgetContext";  // ← NUEVO

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BudgetProvider>
      <App />
    </BudgetProvider>
  </React.StrictMode>
);
