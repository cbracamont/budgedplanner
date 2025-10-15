import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { Language } from "@/lib/i18n";

interface FinancialChartsProps {
  totalIncome: number;
  totalDebts: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  language: Language;
}

export const FinancialCharts = ({
  totalIncome,
  totalDebts,
  totalFixedExpenses,
  totalVariableExpenses,
  language
}: FinancialChartsProps) => {
  const availableForSavings = totalIncome - (totalDebts + totalFixedExpenses + totalVariableExpenses);

  const pieData = [
    { name: language === 'en' ? 'Debts' : 'Deudas', value: totalDebts, color: 'hsl(var(--debt))' },
    { name: language === 'en' ? 'Fixed Expenses' : 'Gastos Fijos', value: totalFixedExpenses, color: 'hsl(var(--warning))' },
    { name: language === 'en' ? 'Variable Expenses' : 'Gastos Variables', value: totalVariableExpenses, color: 'hsl(var(--primary))' },
    { name: language === 'en' ? 'Available' : 'Disponible', value: Math.max(0, availableForSavings), color: 'hsl(var(--success))' }
  ].filter(item => item.value > 0);

  const barData = [
    {
      name: language === 'en' ? 'Income' : 'Ingresos',
      value: totalIncome,
      fill: 'hsl(var(--income))'
    },
    {
      name: language === 'en' ? 'Expenses' : 'Gastos',
      value: totalDebts + totalFixedExpenses + totalVariableExpenses,
      fill: 'hsl(var(--destructive))'
    },
    {
      name: language === 'en' ? 'Available' : 'Disponible',
      value: Math.max(0, availableForSavings),
      fill: 'hsl(var(--success))'
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Income vs Expenses Bar Chart */}
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>{language === 'en' ? 'Financial Overview' : 'Resumen Financiero'}</CardTitle>
          </div>
          <CardDescription>
            {language === 'en' ? 'Income, expenses, and available balance' : 'Ingresos, gastos y saldo disponible'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `£${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expense Distribution Pie Chart */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>{language === 'en' ? 'Expense Distribution' : 'Distribución de Gastos'}</CardTitle>
          <CardDescription>
            {language === 'en' ? 'How your income is allocated' : 'Cómo se distribuyen tus ingresos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `£${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};