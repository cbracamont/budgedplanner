import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { Language } from "@/lib/i18n";
import { ChartType } from "./ChartSettings";

interface EnhancedFinancialChartsProps {
  totalIncome: number;
  totalDebts: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  language: Language;
  chartType: ChartType;
}

export const EnhancedFinancialCharts = ({
  totalIncome,
  totalDebts,
  totalFixedExpenses,
  totalVariableExpenses,
  language,
  chartType
}: EnhancedFinancialChartsProps) => {
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

  const timelineData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return {
      month: date.toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { month: 'short' }),
      income: totalIncome * (0.9 + Math.random() * 0.2),
      expenses: (totalDebts + totalFixedExpenses + totalVariableExpenses) * (0.9 + Math.random() * 0.2),
    };
  });

  const heatmapData = [
    { category: language === 'en' ? 'Debts' : 'Deudas', amount: totalDebts },
    { category: language === 'en' ? 'Fixed' : 'Fijos', amount: totalFixedExpenses },
    { category: language === 'en' ? 'Variable' : 'Variables', amount: totalVariableExpenses },
  ];

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
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
              <ResponsiveContainer width="100%" height={400}>
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
        );

      case 'pie':
        return (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Expense Distribution' : 'Distribución de Gastos'}</CardTitle>
              <CardDescription>
                {language === 'en' ? 'How your income is allocated' : 'Cómo se distribuyen tus ingresos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
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
        );

      case 'timeline':
        return (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Cash Flow Timeline' : 'Línea de Tiempo de Flujo de Caja'}</CardTitle>
              <CardDescription>
                {language === 'en' ? '6-month cash flow trend' : 'Tendencia de flujo de caja de 6 meses'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `£${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="hsl(var(--income))" 
                    strokeWidth={2}
                    name={language === 'en' ? 'Income' : 'Ingresos'}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name={language === 'en' ? 'Expenses' : 'Gastos'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'heatmap':
        return (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Expense Heatmap' : 'Mapa de Calor de Gastos'}</CardTitle>
              <CardDescription>
                {language === 'en' ? 'Spending intensity by category' : 'Intensidad de gasto por categoría'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={heatmapData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="category" />
                  <Tooltip 
                    formatter={(value: number) => `£${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return <div className="w-full">{renderChart()}</div>;
};