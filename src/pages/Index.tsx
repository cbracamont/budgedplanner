import { useState, useEffect } from "react";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
import { EnhancedSavingsManager } from "@/components/EnhancedSavingsManager";
import { EnhancedFinancialCharts } from "@/components/EnhancedFinancialCharts";
import { WallpaperSettings } from "@/components/WallpaperSettings";
import { ChartSettings, ChartType } from "@/components/ChartSettings";
import { BudgetSummary } from "@/components/BudgetSummary";
import { EnhancedDebtAdvisor } from "@/components/EnhancedDebtAdvisor";
import { CalendarView } from "@/components/CalendarView";
import { LanguageToggle } from "@/components/LanguageToggle";
import { FinancialAdvisor } from "@/components/FinancialAdvisor";
import { ExcelManager } from "@/components/ExcelManager";
import { DailyRecommendations } from "@/components/DailyRecommendations";
import { SavingsGoalsManager } from "@/components/SavingsGoalsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, LogOut } from "lucide-react";
import { Language, getTranslation } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

interface IndexProps {
  onWallpaperChange?: (url: string | null) => void;
}

const Index = ({ onWallpaperChange }: IndexProps = {}) => {
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<any>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalDebts, setTotalDebts] = useState(0);
  const [totalFixedExpenses, setTotalFixedExpenses] = useState(0);
  const [totalVariableExpenses, setTotalVariableExpenses] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [emergencyFund, setEmergencyFund] = useState(0);
  const [emergencyFundTarget, setEmergencyFundTarget] = useState(0);
  const [chartType, setChartType] = useState<ChartType>('bar');
  
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

  const loadChartPreference = async (userId: string) => {
    const { data } = await supabase
      .from('app_settings')
      .select('chart_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.chart_type) {
      setChartType(data.chart_type as ChartType);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const reloadData = () => {
    if (user) {
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
    }
  };

  // Load data for calendar and advisor
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      const [incomeResult, debtResult, fixedResult, savingsResult] = await Promise.all([
        supabase.from("income_sources").select("*").order("created_at"),
        supabase.from("debts").select("*").order("created_at"),
        supabase.from("fixed_expenses").select("*").order("created_at"),
        supabase.from("savings").select("*").eq("user_id", user.id).maybeSingle()
      ]);
      
      if (incomeResult.data) setIncomeData(incomeResult.data);
      if (debtResult.data) setDebtData(debtResult.data);
      if (fixedResult.data) setFixedExpensesData(fixedResult.data);
      if (savingsResult.data) {
        setTotalSavings(savingsResult.data.total_accumulated || 0);
        setEmergencyFund(savingsResult.data.emergency_fund || 0);
        // Calculate emergency fund target (3-6 months of expenses)
        const monthlyExpenses = totalFixedExpenses + totalVariableExpenses;
        setEmergencyFundTarget(monthlyExpenses * 4); // Default to 4 months
      }
    };
    
    loadData();
  }, [user, totalFixedExpenses, totalVariableExpenses]);

  // Calculate payments for calendar with IDs and source tables
  const calendarPayments = [
    ...incomeData.map(income => ({
      id: income.id,
      name: income.name,
      amount: income.amount,
      dueDay: income.payment_day,
      category: 'income' as const,
      sourceTable: 'income_sources' as const
    })),
    ...debtData.map(debt => {
      // Calculate current installment if applicable
      let currentInstallment = undefined;
      let totalInstallments = undefined;
      
      if (debt.is_installment && debt.start_date && debt.number_of_installments) {
        const startDate = new Date(debt.start_date);
        const today = new Date();
        const monthsPassed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        currentInstallment = Math.min(monthsPassed + 1, debt.number_of_installments);
        totalInstallments = debt.number_of_installments;
      }
      
      return {
        id: debt.id,
        name: debt.name,
        amount: debt.minimum_payment,
        dueDay: debt.payment_day,
        category: 'debt' as const,
        sourceTable: 'debts' as const,
        isInstallment: debt.is_installment,
        startDate: debt.start_date,
        endDate: debt.end_date,
        currentInstallment,
        totalInstallments
      };
    }),
    ...fixedExpensesData.map(expense => ({
      id: expense.id,
      name: expense.name,
      amount: expense.amount,
      dueDay: expense.payment_day,
      category: 'fixed' as const,
      sourceTable: 'fixed_expenses' as const,
      isAnnual: expense.frequency_type === 'annual',
      paymentMonth: expense.payment_month
    }))
  ];

  // Prepare debt data for advisor
  const debtAdvisorData = debtData.map(debt => ({
    name: debt.name,
    balance: debt.balance,
    apr: debt.apr,
    minimumPayment: debt.minimum_payment,
    promotional_apr: debt.promotional_apr,
    promotional_apr_end_date: debt.promotional_apr_end_date,
    regular_apr: debt.regular_apr
  }));

  const availableForDebt = totalIncome - totalDebts - totalFixedExpenses - totalVariableExpenses;
  const availableForSavings = totalIncome - totalDebts - totalFixedExpenses - totalVariableExpenses;

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
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="calendar">{t('calendar')}</TabsTrigger>
            <TabsTrigger value="advisor">{t('debtAdvisor')}</TabsTrigger>
            <TabsTrigger value="settings">{language === 'en' ? 'Settings' : 'Ajustes'}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Daily Recommendation */}
            <DailyRecommendations
              language={language}
              totalIncome={totalIncome}
              totalDebts={totalDebts}
              totalFixedExpenses={totalFixedExpenses}
              totalVariableExpenses={totalVariableExpenses}
              totalSavings={totalSavings}
              debts={debtAdvisorData}
              emergencyFund={emergencyFund}
              emergencyFundTarget={emergencyFundTarget}
            />

            {/* Financial Charts */}
            <EnhancedFinancialCharts
              totalIncome={totalIncome}
              totalDebts={totalDebts}
              totalFixedExpenses={totalFixedExpenses}
              totalVariableExpenses={totalVariableExpenses}
              language={language}
              chartType={chartType}
            />
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <IncomeManager language={language} onIncomeChange={setTotalIncome} />
                <DebtsManager language={language} onDebtsChange={setTotalDebts} />
                <FixedExpensesManager language={language} onExpensesChange={setTotalFixedExpenses} />
                <VariableExpensesManager onExpensesChange={setTotalVariableExpenses} language={language} />
                <EnhancedSavingsManager 
                  language={language} 
                  availableToSave={availableForSavings}
                  totalExpenses={totalFixedExpenses + totalVariableExpenses}
                />
                <SavingsGoalsManager 
                  language={language} 
                  availableForSavings={availableForSavings}
                  availableBudget={totalIncome - totalFixedExpenses - totalVariableExpenses - totalDebts}
                />
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

          <TabsContent value="advisor" className="space-y-6">
            <EnhancedDebtAdvisor 
              debts={debtAdvisorData.map((d, i) => ({ ...d, id: debtData[i]?.id }))} 
              extraPayment={availableForDebt > 0 ? availableForDebt : 0}
              language={language} 
            />
            <FinancialAdvisor language={language} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <ChartSettings 
                language={language}
                selectedChart={chartType}
                onChartChange={setChartType}
              />
              <WallpaperSettings language={language} onWallpaperChange={onWallpaperChange || (() => {})} />
            </div>
            <ExcelManager language={language} onDataImported={reloadData} />
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
