import { useState, useEffect } from "react";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesForm } from "@/components/VariableExpensesForm";
import { BudgetSummary } from "@/components/BudgetSummary";
import { DebtForecast } from "@/components/DebtForecast";
import { DebtAdvisor } from "@/components/DebtAdvisor";
import { CalendarView } from "@/components/CalendarView";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, LogOut } from "lucide-react";
import { Language, getTranslation } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<any>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalDebts, setTotalDebts] = useState(0);
  const [totalFixedExpenses, setTotalFixedExpenses] = useState(0);
  const [groceries, setGroceries] = useState(0);
  const [dining, setDining] = useState(0);
  const [transport, setTransport] = useState(0);
  const [shopping, setShopping] = useState(0);
  const [entertainment, setEntertainment] = useState(0);
  const [extraDebtPayment, setExtraDebtPayment] = useState(0);
  
  // Data for calendar and advisor
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [debtData, setDebtData] = useState<any[]>([]);
  const [fixedExpensesData, setFixedExpensesData] = useState<any[]>([]);
  
  const t = (key: string) => getTranslation(language, key);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleVariableExpensesChange = (newGroceries: number, newDining: number, newTransport: number, newShopping: number, newEntertainment: number) => {
    setGroceries(newGroceries);
    setDining(newDining);
    setTransport(newTransport);
    setShopping(newShopping);
    setEntertainment(newEntertainment);
  };

  // Load data for calendar and advisor
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      const [incomeResult, debtResult, fixedResult] = await Promise.all([
        supabase.from("income_sources").select("*").order("created_at"),
        supabase.from("debts").select("*").order("created_at"),
        supabase.from("fixed_expenses").select("*").order("created_at")
      ]);
      
      if (incomeResult.data) setIncomeData(incomeResult.data);
      if (debtResult.data) setDebtData(debtResult.data);
      if (fixedResult.data) setFixedExpensesData(fixedResult.data);
    };
    
    loadData();
  }, [user]);

  // Calculate payments for calendar
  const calendarPayments = [
    ...incomeData.map(income => ({
      name: income.name,
      amount: income.amount,
      dueDay: income.payment_day,
      category: 'income' as const
    })),
    ...debtData.map(debt => ({
      name: debt.name,
      amount: debt.minimum_payment,
      dueDay: debt.payment_day,
      category: 'debt' as const
    })),
    ...fixedExpensesData.map(expense => ({
      name: expense.name,
      amount: expense.amount,
      dueDay: expense.payment_day,
      category: 'fixed' as const
    }))
  ];

  // Prepare debt data for advisor
  const debtAdvisorData = debtData.map(debt => ({
    name: debt.name,
    balance: debt.balance,
    apr: debt.apr,
    minimumPayment: debt.minimum_payment
  }));

  const totalVariableExpenses = groceries + dining + transport + shopping + entertainment;
  const availableForDebt = totalIncome - totalDebts - totalFixedExpenses - totalVariableExpenses;

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-medium">
              <Calculator className="h-8 w-8 text-primary-foreground" />
            </div>
            <LanguageToggle language={language} onLanguageChange={setLanguage} />
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {language === 'en' ? 'Sign Out' : 'Cerrar Sesión'}
            </Button>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            {t('appTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('appDescription')}
          </p>
        </header>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="calendar">{t('calendar')}</TabsTrigger>
            <TabsTrigger value="advisor">{t('debtAdvisor')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <IncomeManager language={language} onIncomeChange={setTotalIncome} />
                <DebtsManager language={language} onDebtsChange={setTotalDebts} />
                <FixedExpensesManager language={language} onExpensesChange={setTotalFixedExpenses} />
                <VariableExpensesForm onExpensesChange={handleVariableExpensesChange} language={language} />
                <DebtForecast totalDebts={totalDebts} language={language} />
              </div>

              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-8">
                  <BudgetSummary 
                    totalIncome={totalIncome} 
                    totalDebts={totalDebts}
                    totalFixedExpenses={totalFixedExpenses}
                    totalVariableExpenses={totalVariableExpenses}
                    language={language}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView payments={calendarPayments} language={language} />
          </TabsContent>

          <TabsContent value="advisor">
            <DebtAdvisor 
              debts={debtAdvisorData} 
              extraPayment={availableForDebt > 0 ? availableForDebt : 0}
              language={language} 
            />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>{t('calculationsNote')}</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
