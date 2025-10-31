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
import { BudgetSummary } from "@/components/BudgetSummary";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { differenceInMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  useTheme();
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getCategoryName } = useCategoryNames(language);

  // Traducciones simples
  const t = (key: string) => {
    const dict: Record<string, Record<Language, string>> = {
      appTitle: { en: "My Finance", es: "Mis Finanzas" },
      dashboard: { en: "Dashboard", es: "Panel" },
      printReport: { en: "Print Report", es: "Imprimir Reporte" },
      summary: { en: "Summary", es: "Resumen" },
      totalIncome: { en: "Total Income", es: "Ingresos Totales" },
      totalDebts: { en: "Total Debt", es: "Deuda Total" },
      fixedExpenses: { en: "Fixed Expenses", es: "Gastos Fijos" },
      variableExpenses: { en: "Variable Expenses", es: "Gastos Variables" },
      availableForDebt: { en: "Available", es: "Disponible" },
      emergencyFund: { en: "Emergency Fund", es: "Fondo de Emergencia" },
    };
    return dict[key]?.[language] || key;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Datos
  const { data: incomeData = [], isLoading: incomeLoading } = useIncomeSources();
  const { data: debtData = [], isLoading: debtsLoading } = useDebts();
  const { data: fixedExpensesData = [], isLoading: fixedLoading } = useFixedExpenses();
  const { data: variableExpensesData = [], isLoading: variableLoading } = useVariableExpenses();
  const { data: savingsGoalsData = [], isLoading: goalsLoading } = useSavingsGoals();
  const { data: savings, isLoading: savingsLoading } = useSavings();

  const dataLoading =
    incomeLoading || debtsLoading || fixedLoading || variableLoading || goalsLoading || savingsLoading;

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
  const emergencyFund = savings?.emergency_fund || 0;
  const totalSavingsContributions =
    totalActiveSavingsGoals + monthlyEmergencyContribution + (savings?.monthly_goal || 0);
  const emergencyFundTarget = (totalFixedExpenses + totalVariableExpenses) * 4;
  const availableForDebt =
    totalIncome - totalDebts - totalFixedExpenses - totalVariableExpenses - totalSavingsContributions;

  // Auth
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

  // Imprimir
  const printReport = () => {
    window.print();
  };

  if (authLoading)
    return (
      <div className="flex justify-center p-8">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  if (!user) return <Auth />;

  return (
    <>
      {/* ESTILOS DE IMPRESIÓN */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          body, .print-container { background: white !important; padding: 20px; font-size: 12px; }
          .print-title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
          .print-section { margin: 20px 0; page-break-inside: avoid; }
          .print-row { display: flex; justify-content: space-between; margin: 6px 0; }
          .print-label { font-weight: bold; }
          .print-chart { width: 100%; height: auto; max-height: 400px; margin: 20px 0; }
        }
      `}</style>

      <div className="min-h-screen bg-background py-8 px-4 print-container">
        <div className="max-w-7xl mx-auto">
          {/* CABECERA (solo en pantalla) */}
          <div className="no-print text-center mb-8">
            <div className="flex justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <LanguageToggle language={language} onLanguageChange={setLanguage} />
              <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                {language === "es" ? "Salir" : "Sign Out"}
              </Button>
            </div>
            <h1 className="text-4xl font-bold">{t("appTitle")}</h1>
          </div>

          {/* BOTÓN IMPRIMIR */}
          <div className="flex justify-end mb-6 no-print">
            <Button onClick={printReport} size="sm">
              <Printer className="mr-2 h-4 w-4" />
              {t("printReport")}
            </Button>
          </div>

          {/* REPORTE IMPRIMIBLE */}
          <div className="print-title">
            {t("appTitle")} - {new Date().toLocaleDateString()}
          </div>

          {/* RESUMEN */}
          <div className="print-section border-b pb-4">
            <h2 className="text-lg font-bold mb-3">{t("summary")}</h2>
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

          {/* GRÁFICO */}
          <div className="print-section">
            <EnhancedFinancialCharts
              totalIncome={totalIncome}
              totalDebts={totalDebts}
              totalFixedExpenses={totalFixedExpenses}
              totalVariableExpenses={totalVariableExpenses}
              totalSavingsAccumulated={emergencyFund}
              language={language}
              chartType="bar"
            />
          </div>

          {/* DASHBOARD (solo en pantalla) */}
          <div className="no-print">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard">{t("dashboard")}</TabsTrigger>
                <TabsTrigger value="income">Ingresos</TabsTrigger>
                <TabsTrigger value="debts">Deudas</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
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
              </TabsContent>

              <TabsContent value="income">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {getCategoryName("income")}
                    </h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <IncomeManager />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              <TabsContent value="debts">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full p-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {getCategoryName("debts")}
                    </h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <DebtsManager />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
