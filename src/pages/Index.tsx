import { useState, useEffect } from "react";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesForm } from "@/components/VariableExpensesForm";
import { BudgetSummary } from "@/components/BudgetSummary";
import { DebtForecast } from "@/components/DebtForecast";
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

  const totalVariableExpenses = groceries + dining + transport + shopping + entertainment;

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
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="calendar">{t('calendar')}</TabsTrigger>
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
            <CalendarView payments={[]} language={language} />
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
