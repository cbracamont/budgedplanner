export type Language = 'en' | 'es';

export const translations = {
  en: {
    // App title
    appTitle: "Family Budget UK",
    appDescription: "Manage your family finances with clarity. Track income, debts, and expenses to plan your financial future.",
    
    // Navigation
    dashboard: "Dashboard",
    calendar: "Payment Calendar",
    debtAdvisor: "Debt Advisor",
    scenarios: "What If Scenarios",
    
    // Categories
    emergencyFund: "Emergency Fund",
    savings: "Savings",
    savingsGoals: "Saving Pots",
    
    // Income
    income: "Income",
    salary: "Salary",
    tips: "Tips / Extra Income",
    universalCredit: "Universal Credit",
    childBenefit: "Child Benefit",
    freelance: "Freelance Income",
    totalIncome: "Total Income",
    updateIncome: "Update Income",
    
    // Debts
    debts: "Debts & Loans",
    personalLoan: "Personal Loan",
    carFinance: "Car Finance",
    creditCards: "Credit Cards",
    mortgage: "Mortgage",
    totalDebts: "Total Debts",
    updateDebts: "Update Debts",
    bank: "Bank / Provider",
    selectBank: "Select bank",
    interestRate: "Interest Rate (APR %)",
    remainingTerm: "Remaining Term (months)",
    minimumPayment: "Minimum Monthly Payment",
    
    // Fixed Expenses
    fixedExpenses: "Fixed Monthly Expenses",
    rent: "Rent/Mortgage",
    councilTax: "Council Tax",
    utilities: "Utilities (Gas, Electric, Water)",
    internet: "Internet & TV",
    mobilePhone: "Mobile Phone",
    insurance: "Insurance",
    childcare: "Childcare",
    otherFixed: "Other Fixed Expenses",
    updateFixedExpenses: "Update Fixed Expenses",
    provider: "Provider",
    selectProvider: "Select provider",
    paymentFrequency: "Payment Frequency",
    
    // Variable Expenses
    variableExpenses: "Variable Monthly Expenses",
    groceries: "Groceries & Food Shopping",
    supermarket: "Supermarket",
    selectSupermarket: "Select supermarket",
    dining: "Dining Out & Takeaways",
    transport: "Transport & Petrol",
    shopping: "Shopping & Personal Items",
    entertainment: "Entertainment & Leisure",
    education: "Education",
    health: "Health & Pharmacy",
    updateVariableExpenses: "Update Variable Expenses",
    
    // Budget Summary
    financialSummary: "Financial Summary",
    totalExpenses: "Total Expenses",
    monthlyBudget: "Monthly Budget",
    weeklyBudget: "Weekly Budget",
    estimatedSavings: "Estimated Savings",
    availableToSave: "Available to save or spend",
    monthlyDeficit: "Monthly deficit",
    weeklyApprox: "Approximately per week",
    monthlySavingsPotential: "Monthly savings potential",
    noSavingsAvailable: "No savings available - expenses exceed income",
    
    // Debt Forecast
    debtPayoffForecast: "Debt Payoff Forecast",
    debtPayoffDescription: "Calculate how long it will take to pay off your debts",
    extraMonthlyPayment: "Extra Monthly Payment Towards Debts",
    extraPaymentDescription: "Additional amount you can allocate each month to pay off debts",
    calculatePayoffTime: "Calculate Payoff Time",
    estimatedPayoffTime: "Estimated Payoff Time",
    year: "year",
    years: "years",
    month: "month",
    months: "months",
    lessThanMonth: "Less than 1 month",
    monthsInTotal: "months in total",
    noDebts: "Excellent! You have no debts registered.",
    
    // Calendar
    paymentCalendar: "Payment Calendar",
    calendarDescription: "View your income and payment schedule",
    dueDate: "Due Date",
    amount: "Amount",
    category: "Category",
    
    // Debt Advisor
    debtAdvisorTitle: "Debt Prioritisation Advisor",
    debtAdvisorDescription: "Smart recommendations to pay off debts faster",
    debtFreeDate: "Projected Debt-Free Date",
    recommendedStrategy: "Recommended Strategy",
    payoffOrder: "Suggested Payoff Order",
    potentialSavings: "Potential Interest Savings",
    
    // Scenario Simulator
    scenarioSimulator: "What If Scenario Simulator",
    scenarioDescription: "Compare different financial decisions",
    currentScenario: "Current Scenario",
    simulatedScenario: "Simulated Scenario",
    addScenario: "Add Scenario",
    
    // Common
    fixed: "Fixed",
    variable: "Variable",
    frequency: {
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly"
    },
    calculationsNote: "Calculations are estimates based on the information provided",
  },
  es: {
    // App title
    appTitle: "Presupuesto Familiar UK",
    appDescription: "Gestiona las finanzas de tu familia con claridad. Controla ingresos, deudas y gastos para planificar tu futuro financiero.",
    
    // Navigation
    dashboard: "Panel",
    calendar: "Calendario de Pagos",
    debtAdvisor: "Asesor de Deudas",
    scenarios: "Escenarios Qué Pasaría Si",
    
    // Categories
    emergencyFund: "Fondo de Emergencia",
    savings: "Ahorros",
    savingsGoals: "Objetivos de Ahorro",
    
    // Income
    income: "Ingresos",
    salary: "Salario",
    tips: "Propinas / Ingresos Extra",
    universalCredit: "Universal Credit",
    childBenefit: "Child Benefit",
    freelance: "Ingresos Freelance",
    totalIncome: "Ingresos Totales",
    updateIncome: "Actualizar Ingresos",
    
    // Debts
    debts: "Deudas y Préstamos",
    personalLoan: "Préstamo Personal",
    carFinance: "Financiación del Coche",
    creditCards: "Tarjetas de Crédito",
    mortgage: "Hipoteca",
    totalDebts: "Deudas Totales",
    updateDebts: "Actualizar Deudas",
    bank: "Banco / Proveedor",
    selectBank: "Seleccionar banco",
    interestRate: "Tasa de Interés (APR %)",
    remainingTerm: "Plazo Restante (meses)",
    minimumPayment: "Pago Mensual Mínimo",
    
    // Fixed Expenses
    fixedExpenses: "Gastos Fijos Mensuales",
    rent: "Alquiler/Hipoteca",
    councilTax: "Council Tax",
    utilities: "Servicios (Gas, Luz, Agua)",
    internet: "Internet y TV",
    mobilePhone: "Teléfono Móvil",
    insurance: "Seguros",
    childcare: "Cuidado Infantil",
    otherFixed: "Otros Gastos Fijos",
    updateFixedExpenses: "Actualizar Gastos Fijos",
    provider: "Proveedor",
    selectProvider: "Seleccionar proveedor",
    paymentFrequency: "Frecuencia de Pago",
    
    // Variable Expenses
    variableExpenses: "Gastos Variables Mensuales",
    groceries: "Compras de Comida",
    supermarket: "Supermercado",
    selectSupermarket: "Seleccionar supermercado",
    dining: "Restaurantes y Comida para Llevar",
    transport: "Transporte y Gasolina",
    shopping: "Compras y Artículos Personales",
    entertainment: "Entretenimiento y Ocio",
    education: "Educación",
    health: "Salud y Farmacia",
    updateVariableExpenses: "Actualizar Gastos Variables",
    
    // Budget Summary
    financialSummary: "Resumen Financiero",
    totalExpenses: "Gastos Totales",
    monthlyBudget: "Presupuesto Mensual",
    weeklyBudget: "Presupuesto Semanal",
    estimatedSavings: "Ahorro Estimado",
    availableToSave: "Disponible para ahorrar o gastar",
    monthlyDeficit: "Déficit mensual",
    weeklyApprox: "Aproximadamente por semana",
    monthlySavingsPotential: "Potencial de ahorro mensual",
    noSavingsAvailable: "No hay ahorros disponibles - los gastos superan los ingresos",
    
    // Debt Forecast
    debtPayoffForecast: "Proyección de Pago de Deudas",
    debtPayoffDescription: "Calcula cuánto tiempo tomará pagar tus deudas",
    extraMonthlyPayment: "Pago Mensual Extra para Deudas",
    extraPaymentDescription: "Cantidad adicional que puedes asignar cada mes para pagar deudas",
    calculatePayoffTime: "Calcular Tiempo de Pago",
    estimatedPayoffTime: "Tiempo Estimado de Pago",
    year: "año",
    years: "años",
    month: "mes",
    months: "meses",
    lessThanMonth: "Menos de 1 mes",
    monthsInTotal: "meses en total",
    noDebts: "¡Excelente! No tienes deudas registradas.",
    
    // Calendar
    paymentCalendar: "Calendario de Pagos",
    calendarDescription: "Visualiza tus ingresos y fechas de pago",
    dueDate: "Fecha de Vencimiento",
    amount: "Cantidad",
    category: "Categoría",
    
    // Debt Advisor
    debtAdvisorTitle: "Asesor de Priorización de Deudas",
    debtAdvisorDescription: "Recomendaciones inteligentes para pagar deudas más rápido",
    debtFreeDate: "Fecha Proyectada Libre de Deudas",
    recommendedStrategy: "Estrategia Recomendada",
    payoffOrder: "Orden de Pago Sugerido",
    potentialSavings: "Ahorro Potencial en Intereses",
    
    // Scenario Simulator
    scenarioSimulator: "Simulador de Escenarios",
    scenarioDescription: "Compara diferentes decisiones financieras",
    currentScenario: "Escenario Actual",
    simulatedScenario: "Escenario Simulado",
    addScenario: "Agregar Escenario",
    
    // Common
    fixed: "Fijo",
    variable: "Variable",
    frequency: {
      monthly: "Mensual",
      quarterly: "Trimestral",
      yearly: "Anual"
    },
    calculationsNote: "Los cálculos son estimaciones basadas en la información proporcionada",
  }
};

export const getTranslation = (lang: Language, key: string): string => {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const ukBanks = [
  "Barclays", "HSBC", "Lloyds", "NatWest", "Santander", 
  "Nationwide", "Halifax", "TSB", "Monzo", "Starling", 
  "Revolut", "Metro Bank", "First Direct", "Virgin Money", "Other"
];

export const ukSupermarkets = [
  "Tesco", "Sainsbury's", "Asda", "Aldi", "Lidl", 
  "Waitrose", "Morrisons", "Iceland", "Co-op", "Marks & Spencer"
];

export const ukUtilityProviders = [
  "British Gas", "EDF Energy", "Octopus Energy", "E.ON", 
  "Scottish Power", "SSE", "Bulb", "Shell Energy"
];

export const ukMobileProviders = [
  "EE", "O2", "Vodafone", "Three UK", "Sky Mobile", 
  "Virgin Mobile", "BT Mobile", "Tesco Mobile", "giffgaff"
];

export const ukInternetProviders = [
  "Sky", "Virgin Media", "BT", "TalkTalk", "EE", 
  "Vodafone", "Plusnet", "NOW Broadband"
];