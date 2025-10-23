import { useState, useEffect, useMemo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, TrendingUp } from "lucide-react";
import { 
  useIncomeSources, 
  useDebts, 
  useFixedExpenses, 
  useVariableExpenses,
  useSavingsGoals,
  useSavings
} from "@/hooks/useFinancialData";
import { useCategoryNames } from "@/hooks/useCategoryNames";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
import { EmergencyFundManager } from "@/components/EmergencyFundManager";
import { GeneralSavingsManager } from "@/components/GeneralSavingsManager";
import { EnhancedFinancialCharts } from "@/components/EnhancedFinancialCharts";
import { ThemeSettings } from "@/components/ThemeSettings";
import { ChartSettings, ChartType } from "@/components/ChartSettings";
import { BudgetSummary } from "@/components/BudgetSummary";
import { EnhancedDebtAdvisor } from "@/components/EnhancedDebtAdvisor";
import { CalendarView } from "@/components/CalendarView";
import { LanguageToggle } from "@/components/LanguageToggle";
import { FinancialAdvisor } from "@/components/FinancialAdvisor";
import { ExcelManager } from "@/components/ExcelManager";
import { DailyRecommendations } from "@/components/DailyRecommendations";
import { SavingsGoalsManager } from "@/components/SavingsGoalsManager";
import { CategoryNameEditor } from "@/components/CategoryNameEditor";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Footer } from "@/components/Footer";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, LogOut, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Language, getTranslation } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";

interface IndexProps {
  onWallpaperChange?: (url: string | null) => void;
}

const Index = ({ onWallpaperChange }: IndexProps = {}) => {
  useTheme();

  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { getCategoryName } = useCategoryNames(language);
  
  // Fetch all data with React Query
  const { data: incomeData = [], isLoading: incomeLoading } = useIncomeSources();
  const { data: debtData = [], isLoading: debtsLoading } = useDebts();
  const { data: fixedExpensesData = [], isLoading: fixedLoading } = useFixedExpenses();
  const { data: variableExpensesData = [], isLoading: variableLoading } = useVariableExpenses();
  const { data: savingsGoalsData = [], isLoading: goalsLoading } = useSavingsGoals();
  const { data: savings, isLoading: savingsLoading } = useSavings();
  
  const dataLoading = incomeLoading || debtsLoading || fixedLoading || variableLoading || goalsLoading || savingsLoading;

  // Calculate totals automatically from query data
  const totalIncome = useMemo(() => 
    incomeData.reduce((sum, source) => sum + source.amount, 0), 
    [incomeData]
  );

  const totalDebts = useMemo(() => 
    debtData.reduce((sum, debt) => sum + debt.minimum_payment, 0), 
    [debtData]
  );

  const totalFixedExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    return fixedExpensesData.reduce((sum, expense) => {
      if (expense.frequency_type === 'annual') {
        return sum + (expense.payment_month === currentMonth ? expense.amount : 0);
      }
      return sum + expense.amount;
    }, 0);
  }, [fixedExpensesData]);

  const totalVariableExpenses = useMemo(() => 
    variableExpensesData.reduce((sum, exp) => sum + exp.amount, 0), 
    [variableExpensesData]
  );

  const totalActiveSavingsGoals = useMemo(() => 
    savingsGoalsData
      .filter(goal => goal.is_active)
      .reduce((sum, goal) => sum + (goal.monthly_contribution || 0), 0),
    [savingsGoalsData]
  );

  const monthlyEmergencyContribution = useMemo(() => 
    savings?.monthly_emergency_contribution || 0,
    [savings]
  );
  
  const totalSavings = useMemo(() => 
    savings?.total_accumulated || 0,
    [savings]
  );

  const emergencyFund = useMemo(() => 
    savings?.emergency_fund || 0,
    [savings]
  );

  const emergencyFundTarget = useMemo(() => {
    const monthlyExpenses = totalFixedExpenses + totalVariableExpenses;
    return monthlyExpenses * 4;
  }, [totalFixedExpenses, totalVariableExpenses]);
  
  const t = (key: string) => getTranslation(language, key);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
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
    // React Query will handle data reloading automatically
    queryClient.invalidateQueries({ queryKey: ["income_sources"] });
    queryClient.invalidateQueries({ queryKey: ["debts"] });
    queryClient.invalidateQueries({ queryKey: ["fixed_expenses"] });
    queryClient.invalidateQueries({ queryKey: ["variable_expenses"] });
    queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
    queryClient.invalidateQueries({ queryKey: ["savings"] });
  };

  const monthlySavingsGoal = useMemo(() => 
    savings?.monthly_goal || 0,
    [savings]
  );

  const totalSavingsContributions = totalActiveSavingsGoals + monthlyEmergencyContribution + monthlySavingsGoal;

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
    })),
    ...savingsGoalsData.map(goal => ({
      id: goal.id,
      name: goal.goal_name,
      amount: goal.monthly_contribution || 0,
      dueDay: 1, // First day of month
      category: 'savings' as const,
      sourceTable: 'savings_goals' as const,
      targetDate: goal.target_date,
      isRecurring: true
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

  const availableForDebt = totalIncome - totalDebts - totalFixedExpenses - totalVariableExpenses - totalSavingsContributions;
  const availableForSavings = totalIncome - totalDebts - totalFixedExpenses - totalVariableExpenses - totalSavingsContributions;

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-pulse">
            <Calculator className="h-12 w-12 mx-auto text-primary" />
          </div>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Loading your financial data...' : 'Cargando tus datos financieros...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Auth />
        <DisclaimerBanner language={language} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-gold rounded-xl shadow-gold">
              <Calculator className="h-8 w-8 text-foreground" />
            </div>
            <CategoryNameEditor language={language} />
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Navigation */}
          <TabsList className="hidden md:grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="calendar">{t('calendar')}</TabsTrigger>
            <TabsTrigger value="advisor">{t('debtAdvisor')}</TabsTrigger>
            <TabsTrigger value="settings">{language === 'en' ? 'Settings' : 'Ajustes'}</TabsTrigger>
          </TabsList>

          {/* Mobile Navigation - Hamburger Menu */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">
              {activeTab === 'dashboard' && t('dashboard')}
              {activeTab === 'calendar' && t('calendar')}
              {activeTab === 'advisor' && t('debtAdvisor')}
              {activeTab === 'settings' && (language === 'en' ? 'Settings' : 'Ajustes')}
            </h2>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Button
                    variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab('dashboard');
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t('dashboard')}
                  </Button>
                  <Button
                    variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab('calendar');
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t('calendar')}
                  </Button>
                  <Button
                    variant={activeTab === 'advisor' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab('advisor');
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t('debtAdvisor')}
                  </Button>
                  <Button
                    variant={activeTab === 'settings' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab('settings');
                      setMobileMenuOpen(false);
                    }}
                  >
                    {language === 'en' ? 'Settings' : 'Ajustes'}
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

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
              totalSavingsAccumulated={emergencyFund + totalSavings}
              language={language}
              chartType={chartType}
            />
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-income shadow-gold hover:shadow-premium transition-all duration-300 mb-4">
                      <h2 className="text-xl font-bold text-income-foreground flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {getCategoryName('income')}
                      </h2>
                      <ChevronDown className="h-5 w-5 text-income-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <IncomeManager language={language} />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-debt shadow-gold hover:shadow-premium transition-all duration-300 mb-4">
                      <h2 className="text-xl font-bold text-debt-foreground flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {getCategoryName('debts')}
                      </h2>
                      <ChevronDown className="h-5 w-5 text-debt-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <DebtsManager language={language} />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-accent shadow-gold hover:shadow-premium transition-all duration-300 mb-4">
                      <h2 className="text-xl font-bold text-accent-foreground flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {getCategoryName('fixedExpenses')}
                      </h2>
                      <ChevronDown className="h-5 w-5 text-accent-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <FixedExpensesManager language={language} />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-expenses shadow-gold hover:shadow-premium transition-all duration-300 mb-4">
                      <h2 className="text-xl font-bold text-expenses-foreground flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {getCategoryName('variableExpenses')}
                      </h2>
                      <ChevronDown className="h-5 w-5 text-expenses-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <VariableExpensesManager language={language} />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-warning shadow-gold hover:shadow-premium transition-all duration-300 mb-4">
                      <h2 className="text-xl font-bold text-warning-foreground flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {getCategoryName('emergencyFund')}
                      </h2>
                      <ChevronDown className="h-5 w-5 text-warning-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <EmergencyFundManager 
                      language={language} 
                      totalExpenses={totalFixedExpenses + totalVariableExpenses}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-income shadow-gold hover:shadow-premium transition-all duration-300 mb-4">
                      <h2 className="text-xl font-bold text-income-foreground flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {getCategoryName('savings')}
                      </h2>
                      <ChevronDown className="h-5 w-5 text-income-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <GeneralSavingsManager 
                      language={language} 
                      availableToSave={availableForSavings}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-gold shadow-gold hover:shadow-premium transition-all duration-300 mb-4">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        {getCategoryName('savingsGoals')}
                      </h2>
                      <ChevronDown className="h-5 w-5 text-primary transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SavingsGoalsManager
                      language={language} 
                      availableForSavings={availableForSavings}
                      availableBudget={totalIncome - totalFixedExpenses - totalVariableExpenses - totalDebts}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-8">
                  <BudgetSummary 
                    totalIncome={totalIncome} 
                    totalDebts={totalDebts}
                    totalFixedExpenses={totalFixedExpenses}
                    totalVariableExpenses={totalVariableExpenses}
                    totalSavingsGoals={totalActiveSavingsGoals}
                    monthlyEmergencyContribution={monthlyEmergencyContribution}
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
              <ThemeSettings language={language} onThemeChange={(theme) => console.log('Theme changed:', theme)} />
            </div>
            <ExcelManager language={language} onDataImported={reloadData} />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>{t('calculationsNote')}</p>
        </footer>
      </div>
      <DisclaimerBanner language={language} />
      <Footer language={language} />
    </div>
  );
};

export default Index;
