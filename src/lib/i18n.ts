export type Language = 'en' | 'es' | 'pt' | 'pl' | 'ro';

export const translations = {
  en: {
    // App title
    appTitle: "Family Budget UK",
    appDescription: "Manage your family finances with clarity. Track income, debts, and expenses to plan your financial future.",
    
    // Navigation
    dashboard: "Dashboard",
    calendar: "Payment Calendar",
    debtAdvisor: "Financial Forecast",
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
    
    // Financial Analysis
    debtAdvisorTitle: "Financial Forecast",
    debtAdvisorDescription: "Smart recommendations to become debt-free faster",
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
    
    // Financial Profiles
    financialProfiles: "Financial Profiles",
    selectProfile: "Select Profile",
    createNewProfile: "Create New Profile",
    profileName: "Profile Name",
    personal: "Personal",
    family: "Family",
    business: "Business",
    createProfile: "Create Profile",
    cannotDeleteLastProfile: "Cannot delete the last profile",
    
    // Notifications
    notifications: "Notifications",
    markAllRead: "Mark All Read",
    markRead: "Mark Read",
    newNotification: "New",
    noNotifications: "No notifications",
    deleteNotification: "Delete",
  },
  es: {
    // App title
    appTitle: "Presupuesto Familiar UK",
    appDescription: "Gestiona las finanzas de tu familia con claridad. Controla ingresos, deudas y gastos para planificar tu futuro financiero.",
    
    // Navigation
    dashboard: "Panel",
    calendar: "Calendario de Pagos",
    debtAdvisor: "Pronóstico Financiero",
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
    
    // Financial Analysis
    debtAdvisorTitle: "Pronóstico Financiero",
    debtAdvisorDescription: "Recomendaciones inteligentes para liberarte de deudas más rápido",
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
    
    // Financial Profiles
    financialProfiles: "Perfiles Financieros",
    selectProfile: "Seleccionar Perfil",
    createNewProfile: "Crear Nuevo Perfil",
    profileName: "Nombre del Perfil",
    personal: "Personal",
    family: "Familiar",
    business: "Negocio",
    createProfile: "Crear Perfil",
    cannotDeleteLastProfile: "No se puede eliminar el último perfil",
    
    // Notifications
    notifications: "Notificaciones",
    markAllRead: "Marcar Todo Leído",
    markRead: "Marcar Leído",
    newNotification: "Nuevo",
    noNotifications: "Sin notificaciones",
    deleteNotification: "Eliminar",
  },
  pt: {
    // App title
    appTitle: "Orçamento Familiar UK",
    appDescription: "Gerencie as finanças da sua família com clareza. Acompanhe rendimentos, dívidas e despesas para planejar o seu futuro financeiro.",
    
    // Navigation
    dashboard: "Painel",
    calendar: "Calendário de Pagamentos",
    debtAdvisor: "Previsão Financeira",
    scenarios: "Cenários E Se",
    
    // Categories
    emergencyFund: "Fundo de Emergência",
    savings: "Poupanças",
    savingsGoals: "Metas de Poupança",
    
    // Income
    income: "Rendimentos",
    salary: "Salário",
    tips: "Gorjetas / Rendimento Extra",
    universalCredit: "Universal Credit",
    childBenefit: "Child Benefit",
    freelance: "Rendimento Freelance",
    totalIncome: "Rendimento Total",
    updateIncome: "Atualizar Rendimentos",
    
    // Debts
    debts: "Dívidas e Empréstimos",
    personalLoan: "Empréstimo Pessoal",
    carFinance: "Financiamento de Carro",
    creditCards: "Cartões de Crédito",
    mortgage: "Hipoteca",
    totalDebts: "Dívidas Totais",
    updateDebts: "Atualizar Dívidas",
    bank: "Banco / Fornecedor",
    selectBank: "Selecionar banco",
    interestRate: "Taxa de Juros (APR %)",
    remainingTerm: "Prazo Restante (meses)",
    minimumPayment: "Pagamento Mensal Mínimo",
    
    // Fixed Expenses
    fixedExpenses: "Despesas Fixas Mensais",
    rent: "Renda/Hipoteca",
    councilTax: "Council Tax",
    utilities: "Serviços (Gás, Eletricidade, Água)",
    internet: "Internet e TV",
    mobilePhone: "Telemóvel",
    insurance: "Seguros",
    childcare: "Cuidados Infantis",
    otherFixed: "Outras Despesas Fixas",
    updateFixedExpenses: "Atualizar Despesas Fixas",
    provider: "Fornecedor",
    selectProvider: "Selecionar fornecedor",
    paymentFrequency: "Frequência de Pagamento",
    
    // Variable Expenses
    variableExpenses: "Despesas Variáveis Mensais",
    groceries: "Compras de Comida",
    supermarket: "Supermercado",
    selectSupermarket: "Selecionar supermercado",
    dining: "Restaurantes e Takeaway",
    transport: "Transporte e Combustível",
    shopping: "Compras e Artigos Pessoais",
    entertainment: "Entretenimento e Lazer",
    education: "Educação",
    health: "Saúde e Farmácia",
    updateVariableExpenses: "Atualizar Despesas Variáveis",
    
    // Budget Summary
    financialSummary: "Resumo Financeiro",
    totalExpenses: "Despesas Totais",
    monthlyBudget: "Orçamento Mensal",
    weeklyBudget: "Orçamento Semanal",
    estimatedSavings: "Poupança Estimada",
    availableToSave: "Disponível para poupar ou gastar",
    monthlyDeficit: "Déficit mensal",
    weeklyApprox: "Aproximadamente por semana",
    monthlySavingsPotential: "Potencial de poupança mensal",
    noSavingsAvailable: "Sem poupanças disponíveis - as despesas excedem o rendimento",
    
    // Debt Forecast
    debtPayoffForecast: "Previsão de Pagamento de Dívidas",
    debtPayoffDescription: "Calcule quanto tempo levará para pagar as suas dívidas",
    extraMonthlyPayment: "Pagamento Mensal Extra para Dívidas",
    extraPaymentDescription: "Valor adicional que pode alocar mensalmente para pagar dívidas",
    calculatePayoffTime: "Calcular Tempo de Pagamento",
    estimatedPayoffTime: "Tempo Estimado de Pagamento",
    year: "ano",
    years: "anos",
    month: "mês",
    months: "meses",
    lessThanMonth: "Menos de 1 mês",
    monthsInTotal: "meses no total",
    noDebts: "Excelente! Não tem dívidas registadas.",
    
    // Calendar
    paymentCalendar: "Calendário de Pagamentos",
    calendarDescription: "Visualize os seus rendimentos e datas de pagamento",
    dueDate: "Data de Vencimento",
    amount: "Valor",
    category: "Categoria",
    
    // Financial Analysis
    debtAdvisorTitle: "Previsão Financeira",
    debtAdvisorDescription: "Recomendações inteligentes para ficar livre de dívidas mais rápido",
    debtFreeDate: "Data Projetada Livre de Dívidas",
    recommendedStrategy: "Estratégia Recomendada",
    payoffOrder: "Ordem de Pagamento Sugerida",
    potentialSavings: "Poupança Potencial em Juros",
    
    // Scenario Simulator
    scenarioSimulator: "Simulador de Cenários",
    scenarioDescription: "Compare diferentes decisões financeiras",
    currentScenario: "Cenário Atual",
    simulatedScenario: "Cenário Simulado",
    addScenario: "Adicionar Cenário",
    
    // Common
    fixed: "Fixo",
    variable: "Variável",
    frequency: {
      monthly: "Mensal",
      quarterly: "Trimestral",
      yearly: "Anual"
    },
    calculationsNote: "Os cálculos são estimativas baseadas nas informações fornecidas",
    
    // Financial Profiles
    financialProfiles: "Perfis Financeiros",
    selectProfile: "Selecionar Perfil",
    createNewProfile: "Criar Novo Perfil",
    profileName: "Nome do Perfil",
    personal: "Pessoal",
    family: "Família",
    business: "Negócio",
    createProfile: "Criar Perfil",
    cannotDeleteLastProfile: "Não é possível excluir o último perfil",
    
    // Notifications
    notifications: "Notificações",
    markAllRead: "Marcar Tudo Lido",
    markRead: "Marcar Lido",
    newNotification: "Novo",
    noNotifications: "Sem notificações",
    deleteNotification: "Excluir",
  },
  pl: {
    // App title
    appTitle: "Budżet Rodzinny UK",
    appDescription: "Zarządzaj finansami swojej rodziny z jasnością. Śledź dochody, długi i wydatki, aby zaplanować swoją przyszłość finansową.",
    
    // Navigation
    dashboard: "Panel",
    calendar: "Kalendarz Płatności",
    debtAdvisor: "Prognoza Finansowa",
    scenarios: "Scenariusze Co Jeśli",
    
    // Categories
    emergencyFund: "Fundusz Awaryjny",
    savings: "Oszczędności",
    savingsGoals: "Cele Oszczędnościowe",
    
    // Income
    income: "Dochody",
    salary: "Pensja",
    tips: "napiwki / Dodatkowy Dochód",
    universalCredit: "Universal Credit",
    childBenefit: "Child Benefit",
    freelance: "Dochód Freelance",
    totalIncome: "Całkowity Dochód",
    updateIncome: "Zaktualizuj Dochody",
    
    // Debts
    debts: "Długi i Pożyczki",
    personalLoan: "Pożyczka Osobista",
    carFinance: "Finansowanie Samochodu",
    creditCards: "Karty Kredytowe",
    mortgage: "Kredyt Hipoteczny",
    totalDebts: "Całkowite Długi",
    updateDebts: "Zaktualizuj Długi",
    bank: "Bank / Dostawca",
    selectBank: "Wybierz bank",
    interestRate: "Stopa Procentowa (APR %)",
    remainingTerm: "Pozostały Okres (miesiące)",
    minimumPayment: "Minimalna Płatność Miesięczna",
    
    // Fixed Expenses
    fixedExpenses: "Stałe Wydatki Miesięczne",
    rent: "Czynsz/Kredyt Hipoteczny",
    councilTax: "Council Tax",
    utilities: "Usługi (Gaz, Prąd, Woda)",
    internet: "Internet i TV",
    mobilePhone: "Telefon Komórkowy",
    insurance: "Ubezpieczenie",
    childcare: "Opieka nad Dziećmi",
    otherFixed: "Inne Stałe Wydatki",
    updateFixedExpenses: "Zaktualizuj Stałe Wydatki",
    provider: "Dostawca",
    selectProvider: "Wybierz dostawcę",
    paymentFrequency: "Częstotliwość Płatności",
    
    // Variable Expenses
    variableExpenses: "Zmienne Wydatki Miesięczne",
    groceries: "Zakupy Spożywcze",
    supermarket: "Supermarket",
    selectSupermarket: "Wybierz supermarket",
    dining: "Restauracje i Jedzenie na Wynos",
    transport: "Transport i Paliwo",
    shopping: "Zakupy i Artykuły Osobiste",
    entertainment: "Rozrywka i Wypoczynek",
    education: "Edukacja",
    health: "Zdrowie i Apteka",
    updateVariableExpenses: "Zaktualizuj Zmienne Wydatki",
    
    // Budget Summary
    financialSummary: "Podsumowanie Finansowe",
    totalExpenses: "Całkowite Wydatki",
    monthlyBudget: "Budżet Miesięczny",
    weeklyBudget: "Budżet Tygodniowy",
    estimatedSavings: "Szacowane Oszczędności",
    availableToSave: "Dostępne do oszczędzania lub wydania",
    monthlyDeficit: "Deficyt miesięczny",
    weeklyApprox: "Około tygodniowo",
    monthlySavingsPotential: "Potencjał oszczędności miesięcznych",
    noSavingsAvailable: "Brak dostępnych oszczędności - wydatki przekraczają dochody",
    
    // Debt Forecast
    debtPayoffForecast: "Prognoza Spłaty Długów",
    debtPayoffDescription: "Oblicz, ile czasu zajmie spłata Twoich długów",
    extraMonthlyPayment: "Dodatkowa Miesięczna Płatność na Długi",
    extraPaymentDescription: "Dodatkowa kwota, którą możesz przeznaczyć co miesiąc na spłatę długów",
    calculatePayoffTime: "Oblicz Czas Spłaty",
    estimatedPayoffTime: "Szacowany Czas Spłaty",
    year: "rok",
    years: "lat",
    month: "miesiąc",
    months: "miesięcy",
    lessThanMonth: "Mniej niż 1 miesiąc",
    monthsInTotal: "miesięcy w sumie",
    noDebts: "Świetnie! Nie masz zarejestrowanych długów.",
    
    // Calendar
    paymentCalendar: "Kalendarz Płatności",
    calendarDescription: "Zobacz swoje dochody i harmonogram płatności",
    dueDate: "Termin Płatności",
    amount: "Kwota",
    category: "Kategoria",
    
    // Financial Analysis
    debtAdvisorTitle: "Prognoza Finansowa",
    debtAdvisorDescription: "Inteligentne rekomendacje, aby pozbyć się długów szybciej",
    debtFreeDate: "Przewidywana Data Wolności od Długów",
    recommendedStrategy: "Zalecana Strategia",
    payoffOrder: "Sugerowana Kolejność Spłat",
    potentialSavings: "Potencjalne Oszczędności na Odsetkach",
    
    // Scenario Simulator
    scenarioSimulator: "Symulator Scenariuszy",
    scenarioDescription: "Porównaj różne decyzje finansowe",
    currentScenario: "Obecny Scenariusz",
    simulatedScenario: "Symulowany Scenariusz",
    addScenario: "Dodaj Scenariusz",
    
    // Common
    fixed: "Stały",
    variable: "Zmienny",
    frequency: {
      monthly: "Miesięcznie",
      quarterly: "Kwartalnie",
      yearly: "Rocznie"
    },
    calculationsNote: "Obliczenia są szacunkami opartymi na podanych informacjach",
  },
  ro: {
    // App title
    appTitle: "Buget Familial UK",
    appDescription: "Gestionați finanțele familiei dvs. cu claritate. Urmăriți veniturile, datoriile și cheltuielile pentru a vă planifica viitorul financiar.",
    
    // Navigation
    dashboard: "Panou",
    calendar: "Calendar Plăți",
    debtAdvisor: "Prognoză Financiară",
    scenarios: "Scenarii Ce-Ar Fi Dacă",
    
    // Categories
    emergencyFund: "Fond de Urgență",
    savings: "Economii",
    savingsGoals: "Obiective de Economisire",
    
    // Income
    income: "Venituri",
    salary: "Salariu",
    tips: "Bacșișuri / Venituri Extra",
    universalCredit: "Universal Credit",
    childBenefit: "Child Benefit",
    freelance: "Venituri Freelance",
    totalIncome: "Venit Total",
    updateIncome: "Actualizați Veniturile",
    
    // Debts
    debts: "Datorii și Împrumuturi",
    personalLoan: "Împrumut Personal",
    carFinance: "Finanțare Auto",
    creditCards: "Carduri de Credit",
    mortgage: "Ipotecă",
    totalDebts: "Datorii Totale",
    updateDebts: "Actualizați Datoriile",
    bank: "Bancă / Furnizor",
    selectBank: "Selectați banca",
    interestRate: "Rata Dobânzii (APR %)",
    remainingTerm: "Termen Rămas (luni)",
    minimumPayment: "Plată Lunară Minimă",
    
    // Fixed Expenses
    fixedExpenses: "Cheltuieli Fixe Lunare",
    rent: "Chirie/Ipotecă",
    councilTax: "Council Tax",
    utilities: "Utilități (Gaz, Electricitate, Apă)",
    internet: "Internet și TV",
    mobilePhone: "Telefon Mobil",
    insurance: "Asigurări",
    childcare: "Îngrijire Copii",
    otherFixed: "Alte Cheltuieli Fixe",
    updateFixedExpenses: "Actualizați Cheltuielile Fixe",
    provider: "Furnizor",
    selectProvider: "Selectați furnizorul",
    paymentFrequency: "Frecvență Plată",
    
    // Variable Expenses
    variableExpenses: "Cheltuieli Variabile Lunare",
    groceries: "Cumpărături Alimente",
    supermarket: "Supermarket",
    selectSupermarket: "Selectați supermarketul",
    dining: "Restaurante și Mâncare la Pachet",
    transport: "Transport și Combustibil",
    shopping: "Cumpărături și Articole Personale",
    entertainment: "Divertisment și Timp Liber",
    education: "Educație",
    health: "Sănătate și Farmacie",
    updateVariableExpenses: "Actualizați Cheltuielile Variabile",
    
    // Budget Summary
    financialSummary: "Rezumat Financiar",
    totalExpenses: "Cheltuieli Totale",
    monthlyBudget: "Buget Lunar",
    weeklyBudget: "Buget Săptămânal",
    estimatedSavings: "Economii Estimate",
    availableToSave: "Disponibil pentru economisit sau cheltuit",
    monthlyDeficit: "Deficit lunar",
    weeklyApprox: "Aproximativ pe săptămână",
    monthlySavingsPotential: "Potențial de economisire lunar",
    noSavingsAvailable: "Fără economii disponibile - cheltuielile depășesc veniturile",
    
    // Debt Forecast
    debtPayoffForecast: "Prognoză Plată Datorii",
    debtPayoffDescription: "Calculați cât timp va dura să vă plătiți datoriile",
    extraMonthlyPayment: "Plată Lunară Suplimentară pentru Datorii",
    extraPaymentDescription: "Suma suplimentară pe care o puteți aloca lunar pentru plata datoriilor",
    calculatePayoffTime: "Calculați Timpul de Plată",
    estimatedPayoffTime: "Timp Estimat de Plată",
    year: "an",
    years: "ani",
    month: "lună",
    months: "luni",
    lessThanMonth: "Mai puțin de 1 lună",
    monthsInTotal: "luni în total",
    noDebts: "Excelent! Nu aveți datorii înregistrate.",
    
    // Calendar
    paymentCalendar: "Calendar Plăți",
    calendarDescription: "Vizualizați veniturile și programul de plăți",
    dueDate: "Data Scadentă",
    amount: "Sumă",
    category: "Categorie",
    
    // Financial Analysis
    debtAdvisorTitle: "Prognoză Financiară",
    debtAdvisorDescription: "Recomandări inteligente pentru a scăpa de datorii mai repede",
    debtFreeDate: "Data Proiectată Fără Datorii",
    recommendedStrategy: "Strategie Recomandată",
    payoffOrder: "Ordine de Plată Sugerată",
    potentialSavings: "Economii Potențiale la Dobânzi",
    
    // Scenario Simulator
    scenarioSimulator: "Simulator de Scenarii",
    scenarioDescription: "Comparați diferite decizii financiare",
    currentScenario: "Scenariul Actual",
    simulatedScenario: "Scenariul Simulat",
    addScenario: "Adăugați Scenariu",
    
    // Common
    fixed: "Fix",
    variable: "Variabil",
    frequency: {
      monthly: "Lunar",
      quarterly: "Trimestrial",
      yearly: "Anual"
    },
    calculationsNote: "Calculele sunt estimări bazate pe informațiile furnizate",
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