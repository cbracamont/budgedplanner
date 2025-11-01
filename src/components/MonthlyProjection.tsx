import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { Language } from "@/lib/i18n";
import { useIncomeSources, useDebts, useFixedExpenses, useVariableExpenses, useSavingsGoals, useSavings } from "@/hooks/useFinancialData";
import { useMemo } from "react";

interface MonthlyProjectionProps {
  language: Language;
}

export const MonthlyProjection = ({ language }: MonthlyProjectionProps) => {
  const { data: incomeData = [] } = useIncomeSources();
  const { data: debtData = [] } = useDebts();
  const { data: fixedExpensesData = [] } = useFixedExpenses();
  const { data: variableExpensesData = [] } = useVariableExpenses();
  const { data: savingsGoalsData = [] } = useSavingsGoals();
  const { data: savings } = useSavings();

  const projectionData = useMemo(() => {
    const months = 12;
    const currentDate = new Date();
    const data = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthNumber = date.getMonth() + 1;
      const monthName = date.toLocaleDateString(
        language === 'en' ? 'en-GB' : 'es-ES',
        { month: 'short', year: 'numeric' }
      );

      // Calculate income (always the same each month)
      const income = incomeData.reduce((sum, item) => sum + Number(item.amount), 0);

      // Calculate debts - check if installment debts are still active
      const debts = debtData.reduce((sum, debt) => {
        if (debt.is_installment && debt.start_date && debt.end_date) {
          const debtStartDate = new Date(debt.start_date);
          const debtEndDate = new Date(debt.end_date);
          // Only count if current projected month is within debt period
          if (date >= debtStartDate && date <= debtEndDate) {
            return sum + Number(debt.minimum_payment);
          }
          return sum;
        }
        // Regular debts (non-installment) always count
        return sum + Number(debt.minimum_payment);
      }, 0);

      // Calculate fixed expenses - check frequency
      const fixedExpenses = fixedExpensesData.reduce((sum, expense) => {
        if (expense.frequency_type === 'annual' && expense.payment_month) {
          // Only add if this is the payment month
          if (expense.payment_month === monthNumber) {
            return sum + Number(expense.amount);
          }
          return sum;
        }
        // Monthly expenses always count
        return sum + Number(expense.amount);
      }, 0);

      // Calculate variable expenses (estimated same each month)
      const variableExpenses = variableExpensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);

      // Calculate savings contributions
      const activeSavingsGoals = savingsGoalsData
        .filter(goal => {
          if (!goal.is_active) return false;
          if (goal.target_date) {
            const targetDate = new Date(goal.target_date);
            return date <= targetDate;
          }
          return true;
        })
        .reduce((sum, goal) => sum + Number(goal.monthly_contribution || 0), 0);

      const emergencyContribution = Number(savings?.monthly_emergency_contribution || 0);
      const generalSavings = Number(savings?.monthly_goal || 0);
      const totalSavings = activeSavingsGoals + emergencyContribution + generalSavings;

      const totalExpenses = debts + fixedExpenses + variableExpenses + totalSavings;
      const balance = income - totalExpenses;

      data.push({
        month: monthName,
        income,
        expenses: totalExpenses,
        balance,
        debts,
        fixedExpenses,
        variableExpenses,
        savings: totalSavings
      });
    }

    return data;
  }, [incomeData, debtData, fixedExpensesData, variableExpensesData, savingsGoalsData, savings, language]);

  const translations = {
    en: {
      title: 'Monthly Projection (12 Months)',
      description: 'Projected income, expenses, and balance for the next year',
      income: 'Income',
      expenses: 'Expenses',
      balance: 'Balance',
      breakdown: 'Monthly Breakdown',
      debts: 'Debts',
      fixed: 'Fixed Expenses',
      variable: 'Variable Expenses',
      savings: 'Savings'
    },
    es: {
      title: 'Proyección Mensual (12 Meses)',
      description: 'Proyección de ingresos, gastos y balance para el próximo año',
      income: 'Ingresos',
      expenses: 'Gastos',
      balance: 'Balance',
      breakdown: 'Desglose Mensual',
      debts: 'Deudas',
      fixed: 'Gastos Fijos',
      variable: 'Gastos Variables',
      savings: 'Ahorros'
    }
  };

  const t = translations[language];

  return (
    <div className="space-y-4">
      {/* Main projection chart */}
      <Card className="shadow-medium border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <CardHeader className="bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t.title}
            </CardTitle>
          </div>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" opacity={0.1} />
              <XAxis
                dataKey="month"
                className="text-xs font-semibold"
                tick={{ fill: 'hsl(var(--foreground))' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                className="text-xs font-semibold"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip
                formatter={(value: number) => [`£${value.toFixed(2)}`, '']}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--primary)/0.3)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="hsl(var(--income))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--income))', r: 4 }}
                animationDuration={800}
                name={t.income}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="hsl(var(--debt))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--debt))', r: 4 }}
                animationDuration={800}
                name={t.expenses}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--success))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', r: 4 }}
                animationDuration={800}
                name={t.balance}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expense breakdown chart */}
      <Card className="shadow-medium border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t.breakdown}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" opacity={0.1} />
              <XAxis
                dataKey="month"
                className="text-xs font-semibold"
                tick={{ fill: 'hsl(var(--foreground))' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                className="text-xs font-semibold"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip
                formatter={(value: number) => [`£${value.toFixed(2)}`, '']}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--primary)/0.3)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="debts"
                stackId="1"
                stroke="hsl(var(--debt))"
                fill="hsl(var(--debt))"
                fillOpacity={0.6}
                name={t.debts}
              />
              <Area
                type="monotone"
                dataKey="fixedExpenses"
                stackId="1"
                stroke="hsl(var(--warning))"
                fill="hsl(var(--warning))"
                fillOpacity={0.6}
                name={t.fixed}
              />
              <Area
                type="monotone"
                dataKey="variableExpenses"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                name={t.variable}
              />
              <Area
                type="monotone"
                dataKey="savings"
                stackId="1"
                stroke="hsl(var(--success))"
                fill="hsl(var(--success))"
                fillOpacity={0.6}
                name={t.savings}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
