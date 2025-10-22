import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CalendarDays, PiggyBank, TrendingUp } from "lucide-react";
import { formatCurrency, getTranslation, Language } from "@/lib/i18n";

interface BudgetSummaryProps {
  totalIncome: number;
  totalDebts: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalSavingsGoals: number;
  language: Language;
}

export const BudgetSummary = ({ totalIncome, totalDebts, totalFixedExpenses, totalVariableExpenses, totalSavingsGoals, language }: BudgetSummaryProps) => {
  const t = (key: string) => getTranslation(language, key);
  const totalExpenses = totalDebts + totalFixedExpenses + totalVariableExpenses;
  const monthlyBalance = totalIncome - totalExpenses - totalSavingsGoals;
  const estimatedSavings = monthlyBalance > 0 ? monthlyBalance : 0;
  const weeklyBalance = monthlyBalance / 4;
  const isPositive = monthlyBalance >= 0;

  return (
    <div className="space-y-4">
      <Card className="shadow-medium overflow-hidden">
        <CardHeader className="bg-gradient-primary text-primary-foreground pb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            <CardTitle className="text-lg">{t('financialSummary')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('totalIncome')}</p>
              <p className="text-2xl font-bold text-income">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('totalExpenses')}</p>
              <p className="text-2xl font-bold text-debt">
                {formatCurrency(totalExpenses)}
              </p>
              <div className="text-xs text-muted-foreground space-y-0.5 pt-2">
                <p>{t('debts')}: {formatCurrency(totalDebts)}</p>
                <p>{t('fixed')}: {formatCurrency(totalFixedExpenses)}</p>
                <p>{t('variable')}: {formatCurrency(totalVariableExpenses)}</p>
                <p>{language === 'en' ? 'Savings Goals' : 'Metas de Ahorro'}: {formatCurrency(totalSavingsGoals)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`shadow-medium ${isPositive ? 'border-success' : 'border-warning'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('monthlyBudget')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${isPositive ? 'text-success' : 'text-warning'}`}>
            {formatCurrency(monthlyBalance)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {isPositive ? t('availableToSave') : t('monthlyDeficit')}
          </p>
        </CardContent>
      </Card>

      <Card className={`shadow-medium ${isPositive ? 'border-success' : 'border-warning'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('weeklyBudget')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${isPositive ? 'text-success' : 'text-warning'}`}>
            {formatCurrency(weeklyBalance)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('weeklyApprox')}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-medium border-success/40 bg-success/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <CardTitle className="text-lg">{t('estimatedSavings')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-success">
            {formatCurrency(estimatedSavings)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {estimatedSavings > 0 ? t('monthlySavingsPotential') : t('noSavingsAvailable')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
