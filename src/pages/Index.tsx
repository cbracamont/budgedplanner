// === DENTRO DEL COMPONENTE (reemplaza la función sendToAI) ===
const sendToAI = () => {
  if (!aiInput.trim()) return;
  setAiLoading(true);
  setAiResponse("");

  setTimeout(() => {
    const lower = aiInput.toLowerCase();
    let response = "";

    if (lower.includes("save") || lower.includes("ahorrar") || lower.includes("cut")) {
      response = `To save more:\n1. Review variable expenses (£${totalVariable}) — cut £50-100 on food/entertainment.\n2. Put 50% of any extra income into savings.\n3. Set a "no-spend" weekend each month.`;
    } else if (lower.includes("debt") || lower.includes("deuda") || lower.includes("pay off")) {
      response = `Debt strategy:\n• Pay minimums on all debts.\n• Use 30% of surplus (£${Math.round(cashFlow * 0.3)}) to attack highest APR first.\n• You'll be debt-free in ${monthsToDebtFree} months.`;
    } else if (lower.includes("emergency") || lower.includes("fondo")) {
      response = `Emergency fund goal: 3-6 months of expenses (£${totalExpenses * 3}-£${totalExpenses * 6}).\nYou have £${savingsTotal}. Keep building!`;
    } else if (lower.includes("budget") || lower.includes("presupuesto")) {
      response = `Your budget:\n• Income: ${formatCurrency(totalIncome)}\n• Expenses: ${formatCurrency(totalExpenses)}\n• Cash Flow: ${formatCurrency(cashFlow)}\n${cashFlow > 0 ? "You're saving!" : "Reduce spending by £" + -cashFlow}`;
    } else {
      response = `I see you're asking about "${aiInput}".\n\nQuick tip: Track every expense for 30 days. Most families find £100-200 in hidden waste.\nWant help with a specific category?`;
    }

    setAiResponse(response);
    setAiLoading(false);
  }, 800);
};
