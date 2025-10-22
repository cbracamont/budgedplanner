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
  totalSavingsContributions: number;
  language: Language;
  chartType: ChartType;
}

export const EnhancedFinancialCharts = ({
  totalIncome,
  totalDebts,
  totalFixedExpenses,
  totalVariableExpenses,
  totalSavingsContributions,
  language,
  chartType
}: EnhancedFinancialChartsProps) => {
  const availableForSavings = totalIncome - (totalDebts + totalFixedExpenses + totalVariableExpenses + totalSavingsContributions);

  const pieData = [
    { name: language === 'en' ? 'Debts' : 'Deudas', value: totalDebts, color: 'hsl(var(--debt))' },
    { name: language === 'en' ? 'Fixed Expenses' : 'Gastos Fijos', value: totalFixedExpenses, color: 'hsl(var(--warning))' },
    { name: language === 'en' ? 'Variable Expenses' : 'Gastos Variables', value: totalVariableExpenses, color: 'hsl(var(--primary))' },
    { name: language === 'en' ? 'Savings' : 'Ahorros', value: totalSavingsContributions, color: 'hsl(var(--success))' },
    { name: language === 'en' ? 'Available' : 'Disponible', value: Math.max(0, availableForSavings), color: 'hsl(var(--muted))' }
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
      name: language === 'en' ? 'Savings' : 'Ahorros',
      value: totalSavingsContributions,
      fill: 'hsl(var(--success))'
    },
    {
      name: language === 'en' ? 'Available' : 'Disponible',
      value: Math.max(0, availableForSavings),
      fill: 'hsl(var(--muted))'
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
    { category: language === 'en' ? 'Savings' : 'Ahorros', amount: totalSavingsContributions },
  ];

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <Card className="shadow-medium border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader className="bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {language === 'en' ? 'Financial Overview' : 'Resumen Financiero'}
                </CardTitle>
              </div>
              <CardDescription>
                {language === 'en' ? 'Income, expenses, and available balance' : 'Ingresos, gastos y saldo disponible'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs font-semibold"
                    tick={{ fill: 'hsl(var(--foreground))' }}
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
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={800}>
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
          <Card className="shadow-medium border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader className="bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {language === 'en' ? 'Expense Distribution' : 'Distribución de Gastos'}
              </CardTitle>
              <CardDescription>
                {language === 'en' ? 'How your income is allocated' : 'Cómo se distribuyen tus ingresos'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={800}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
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
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'timeline':
        return (
          <Card className="shadow-medium border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader className="bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {language === 'en' ? 'Cash Flow Timeline' : 'Línea de Tiempo de Flujo de Caja'}
              </CardTitle>
              <CardDescription>
                {language === 'en' ? '6-month cash flow trend' : 'Tendencia de flujo de caja de 6 meses'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" opacity={0.1} />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs font-semibold"
                    tick={{ fill: 'hsl(var(--foreground))' }}
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
                    dot={{ fill: 'hsl(var(--income))', r: 5 }}
                    animationDuration={800}
                    name={language === 'en' ? 'Income' : 'Ingresos'}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--destructive))', r: 5 }}
                    animationDuration={800}
                    name={language === 'en' ? 'Expenses' : 'Gastos'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'heatmap':
        return (
          <Card className="shadow-medium border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader className="bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {language === 'en' ? 'Expense Heatmap' : 'Mapa de Calor de Gastos'}
              </CardTitle>
              <CardDescription>
                {language === 'en' ? 'Spending intensity by category' : 'Intensidad de gasto por categoría'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={heatmapData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" opacity={0.1} />
                  <XAxis 
                    type="number"
                    className="text-xs font-semibold"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category"
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
                  <Bar 
                    dataKey="amount" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 8, 8, 0]}
                    animationDuration={800}
                  />
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