import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CalendarDays, PiggyBank, TrendingUp } from "lucide-react";

interface BudgetSummaryProps {
  totalIncome: number;
  totalDebts: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
}

export const BudgetSummary = ({ totalIncome, totalDebts, totalFixedExpenses, totalVariableExpenses }: BudgetSummaryProps) => {
  const totalExpenses = totalDebts + totalFixedExpenses + totalVariableExpenses;
  const monthlyBalance = totalIncome - totalExpenses;
  const estimatedSavings = monthlyBalance > 0 ? monthlyBalance : 0;
  const weeklyBalance = monthlyBalance / 4;
  const isPositive = monthlyBalance >= 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-medium overflow-hidden">
        <CardHeader className="bg-gradient-primary text-primary-foreground pb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            <CardTitle className="text-lg">Financial Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-income">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-debt">
                {formatCurrency(totalExpenses)}
              </p>
              <div className="text-xs text-muted-foreground space-y-0.5 pt-2">
                <p>Debts: {formatCurrency(totalDebts)}</p>
                <p>Fixed: {formatCurrency(totalFixedExpenses)}</p>
                <p>Variable: {formatCurrency(totalVariableExpenses)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`shadow-medium ${isPositive ? 'border-success' : 'border-warning'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Monthly Budget</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${isPositive ? 'text-success' : 'text-warning'}`}>
            {formatCurrency(monthlyBalance)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {isPositive ? 'Available to save or spend' : 'Monthly deficit'}
          </p>
        </CardContent>
      </Card>

      <Card className={`shadow-medium ${isPositive ? 'border-success' : 'border-warning'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Weekly Budget</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${isPositive ? 'text-success' : 'text-warning'}`}>
            {formatCurrency(weeklyBalance)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Approximately per week
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-medium border-success/40 bg-success/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <CardTitle className="text-lg">Estimated Savings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-success">
            {formatCurrency(estimatedSavings)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {estimatedSavings > 0 ? 'Monthly savings potential' : 'No savings available - expenses exceed income'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
