// app/index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, TrendingUp, Printer } from "lucide-react";
import {
  useIncomeSources,
  useDebts,
  useFixedExpenses,
  useVariableExpenses,
  useSavingsGoals,
  useSavings,
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
import { DebtPaymentTracker } from "@/components/DebtPaymentTracker";
import { DebtEvolutionChart } from "@/components/DebtEvolutionChart";
import { ProfileSelector } from "@/components/ProfileSelector";
import { NotificationCenter } from "@/components/NotificationCenter";
import { FinancialAdvisor } from "@/components/FinancialAdvisor";
import { ExcelManager } from "@/components/ExcelManager";
import { DailyRecommendations } from "@/components/DailyRecommendations";
import { SavingsGoalsManager } from "@/components/SavingsGoalsManager";
import { CategoryNameEditor } from "@/components/CategoryNameEditor";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Footer } from "@/components/Footer";
import { DebtRiskMonitor } from "@/components/DebtRiskMonitor";
import { AchievementsBadges } from "@/components/AchievementsBadges";
import { HouseholdManager } from "@/components/HouseholdManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Language, getTranslation } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";
import { differenceInMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  useTheme();
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { getCategoryName } = useCategoryNames(language);

  const t = (key: string) => getTranslation(language, key);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // === DATA ===
  const { data: incomeData = [], isLoading: incomeLoading, isError: incomeError } = useIncomeSources();
  const { data: debtData = [], isLoading: debtsLoading, isError: debtsError } = useDebts();
  const { data: fixedExpensesData = [], isLoading: fixedLoading, isError: fixedError } = useFixedExpenses();
  const { data: variableExpensesData = [], isLoading: variableLoading, isError: variableError } = useVariableExpenses();
  const { data: savingsGoalsData = [], isLoading: goalsLoading, isError: goalsError } = useSavingsGoals();
  const { data: savings, isLoading: savingsLoading, isError: savingsError } = useSavings();

  const dataLoading =
    incomeLoading || debtsLoading || fixedLoading || variableLoading || goalsLoading || savingsLoading;
  const dataError = incomeError || debtsError || fixedError || variableError || goalsError || savingsError;

  const totalIncome = useMemo(() => incomeData.reduce((sum, s) => sum + s.amount, 0), [incomeData]);
  const totalDebts = useMemo(() => debtData.reduce((sum, d) => sum + d.minimum_payment, 0), [debtData]);
  const totalFixedExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    return fixedExpensesData.reduce((sum, exp) => {
      if (exp.frequency_type === "annual" && exp.payment_month === currentMonth) return sum + exp.amount;
      return sum + exp.amount;
    }, 0);
  }, [fixedExpensesData]);
  const totalVariableExpenses = useMemo(
    () => variableExpensesData.reduce((sum, exp) => sum + exp.amount, 0),
    [variableExpensesData],
  );
  const totalActiveSavingsGoals = useMemo(
    () => savingsGoalsData.filter((g) => g.is_active).reduce((sum, g) => sum + (g.monthly_contribution || 0), 0),
    [savingsGoalsData],
  );
  const monthlyEmergencyContribution = savings?.monthly_emergency_contribution || 0;
  const totalSavings = savings?.total_accumulated || 0;
  const emergencyFund = savings?.emergency_fund || 0;
  const totalSavingsContributions =
    totalActiveSavingsGoals + monthlyEmergencyContribution + (savings?.monthly_goal || 0);
  const emergencyFundTarget = (totalFixedExpenses + totalVariableExpenses) * 4;
  const availableForDebt =
    totalIncome - totalDebts - totalFixedExpenses - totalVariableExpenses - totalSavingsContributions;

  // === AUTH ===
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // === PRINT FUNCTION ===
  const printReport = () => {
    window.print();
  };

  // === RENDER ===
  if (authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  if (!user)
    return (
      <>
        <Auth />
        <DisclaimerBanner language={language} />
      </>
    );
  if (dataError)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive">Error al cargar datos</p>
          <Button onClick={() => location.reload()}>Reintentar</Button>
        </div>
      </div>
    );
  if (dataLoading)
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );

  return (
    <>
      {/* PRINT STYLES */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 20px; }
          .print-title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
          .print-section { margin-bottom: 20px; }
          .print-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .print-label { font-weight: bold; }
        }
      `}</style>

      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12 no-print">
            <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
              <div className="p-3 bg-gradient-gold rounded-xl shadow-gold">
                <Calculator className="h-8 w-8 text-foreground" />
              </div>
              <LanguageToggle language={language} onLanguageChange={setLanguage} />
              <ProfileSelector language={language} />
              <NotificationCenter language={language} />
              <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                {language === "en" ? "Sign Out" : "Cerrar Sesión"}
              </Button>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">{t("appTitle")}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("appDescription")}</p>
          </header>

          {/* PRINT BUTTON */}
          <div className="flex justify-end mb-6 no-print">
            <Button onClick={printReport} size="sm">
              <Printer className="mr-2 h-4 w-4" />
              {language === "en" ? "Print Report" : "Imprimir Reporte"}
            </Button>
          </div>

          {/* PRINTABLE CONTENT */}
          <div className="print-title">
            {t("appTitle")} - {new Date().toLocaleDateString()}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="hidden md:grid w-full grid-cols-5 lg:w-auto lg:inline-grid no-print">
              <TabsTrigger value="dashboard">{t("dashboard")}</TabsTrigger>
              <TabsTrigger value="achievements">{language === "en" ? "Achievements" : "Logros"}</TabsTrigger>
              <TabsTrigger value="calendar">{t("calendar")}</TabsTrigger>
              <TabsTrigger value="advisor">{t("debtAdvisor")}</TabsTrigger>
              <TabsTrigger value="settings">{language === "en" ? "Settings" : "Ajustes"}</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <DebtRiskMonitor totalIncome={totalIncome} totalDebts={totalDebts} language={language} />
              <DailyRecommendations
                language={language}
                totalIncome={totalIncome}
                totalDebts={totalDebts}
                totalFixedExpenses={totalFixedExpenses}
                totalVariableExpenses={totalVariableExpenses}
                totalSavings={totalSavings}
                debts={debtData.map((d) => ({
                  id: d.id,
                  name: d.name,
                  balance: d.balance,
                  apr: d.apr,
                  minimumPayment: d.minimum_payment,
                }))}
                emergencyFund={emergencyFund}
                emergencyFundTarget={emergencyFundTarget}
              />

              {/* PRINT SUMMARY */}
              <div className="print-section">
                <h3 className="text-lg font-bold mb-2">{t("summary") || "Resumen"}</h3>
                <div className="print-row">
                  <span className="print-label">{t("totalIncome")}:</span>
                  <span>{formatCurrency(totalIncome)}</span>
                </div>
                <div className="print-row">
                  <span className="print-label">{t("totalDebts")}:</span>
                  <span>{formatCurrency(totalDebts)}</span>
                </div>
                <div className="print-row">
                  <span className="print-label">{t("fixedExpenses")}:</span>
                  <span>{formatCurrency(totalFixedExpenses)}</span>
                </div>
                <div className="print-row">
                  <span className="print-label">{t("variableExpenses")}:</span>
                  <span>{formatCurrency(totalVariableExpenses)}</span>
                </div>
                <div className="print-row">
                  <span className="print-label">{t("availableForDebt")}:</span>
                  <span>{formatCurrency(availableForDebt)}</span>
                </div>
                <div className="print-row">
                  <span className="print-label">{t("emergencyFund")}:</span>
                  <span>
                    {formatCurrency(emergencyFund)} / {formatCurrency(emergencyFundTarget)}
                  </span>
                </div>
              </div>

              <EnhancedFinancialCharts
                totalIncome={totalIncome}
                totalDebts={totalDebts}
                totalFixedExpenses={totalFixedExpenses}
                totalVariableExpenses={totalVariableExpenses}
                totalSavingsAccumulated={emergencyFund + totalSavings}
                language={language}
                chartType={chartType}
              />

              {/* REST OF DASHBOARD (hidden on print) */}
              <div className="no-print">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {[
                      {
                        key: "income",
                        Comp: IncomeManager,
                        gradient: "bg-gradient-income",
                        text: "text-income-foreground",
                      },
                      { key: "debts", Comp: DebtsManager, gradient: "bg-gradient-debt", text: "text-debt-foreground" },
                      {
                        key: "fixedExpenses",
                        Comp: FixedExpensesManager,
                        gradient: "bg-gradient-accent",
                        text: "text-accent-foreground",
                      },
                      {
                        key: "variableExpenses",
                        Comp: VariableExpensesManager,
                        gradient: "bg-gradient-expenses",
                        text: "text-expenses-foreground",
                      },
                      {
                        key: "emergencyFund",
                        Comp: () => (
                          <EmergencyFundManager
                            language={language}
                            totalExpenses={totalFixedExpenses + totalVariableExpenses}
                          />
                        ),
                        gradient: "bg-gradient-warning",
                        text: "text-warning-foreground",
                      },
                      {
                        key: "savings",
                        Comp: () => <GeneralSavingsManager language={language} availableToSave={availableForDebt} />,
                        gradient: "bg-gradient-income",
                        text: "text-income-foreground",
                      },
                      {
                        key: "savingsGoals",
                        Comp: () => (
                          <SavingsGoalsManager
                            language={language}
                            availableForSavings={availableForDebt}
                            availableBudget={totalIncome - totalFixedExpenses - totalVariableExpenses - totalDebts}
                          />
                        ),
                        gradient: "bg-gradient-gold",
                        text: "text-foreground",
                      },
                    ].map(({ key, Comp, gradient, text }) => (
                      <Collapsible key={key} defaultOpen>
                        <CollapsibleTrigger className="w-full group">
                          <div
                            className={`flex items-center justify-between w-full p-4 rounded-xl ${gradient} shadow-gold hover:shadow-premium transition-all duration-300 mb-4`}
                          >
                            <h2 className={`text-xl font-bold ${text} flex items-center gap-2`}>
                              <TrendingUp className="h-5 w-5" />
                              {getCategoryName(key as any)}
                            </h2>
                            <ChevronDown
                              className={`h-5 w-5 ${text} transition-transform duration-300 group-data-[state=open]:rotate-180`}
                            />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Comp />
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                  <div className="lg:col-span-1 lg:sticky lg:top-8">
                    <BudgetSummary
                      totalIncome={totalIncome}
                      totalDebts={totalDebts}
                      totalFixedExpenses={totalFixedExpenses}
                      totalVariableExpenses={totalVariableExpenses}
                      totalSavingsGoals={totalActiveSavingsGoals}
                      monthlyEmergencyContribution={monthlyEmergencyContribution}
                      language={language}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* OTHER TABS (hidden on print) */}
            <div className="no-print">
              <TabsContent value="achievements">
                <AchievementsBadges language={language} />
              </TabsContent>
              <TabsContent value="calendar">
                <CalendarView payments={[]} language={language} />
              </TabsContent>
              <TabsContent value="advisor">
                <EnhancedDebtAdvisor debts={debtData} extraPayment={availableForDebt} language={language} />
                <DebtEvolutionChart language={language} />
                <DebtPaymentTracker language={language} />
                <FinancialAdvisor language={language} />
              </TabsContent>
              <TabsContent value="settings">
                <HouseholdManager language={language} />
                <div className="grid md:grid-cols-2 gap-6">
                  <ChartSettings language={language} selectedChart={chartType} onChartChange={setChartType} />
                  <ThemeSettings language={language} onThemeChange={() => {}} />
                </div>
                <CategoryNameEditor language={language} />
                <ExcelManager language={language} onDataImported={() => {}} />
              </TabsContent>
            </div>
          </Tabs>

          <footer className="mt-12 text-center text-sm text-muted-foreground print-section">
            <p>{t("calculationsNote") || "Los cálculos son estimados."}</p>
          </footer>
        </div>

        <DisclaimerBanner language={language} />
        <Footer language={language} />
      </div>
    </>
  );
};

export default Index;
