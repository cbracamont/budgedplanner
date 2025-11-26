import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Smile, Heart, Target } from "lucide-react";
import { Language } from "@/lib/i18n";
import { ChartType } from "./ChartSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EnhancedFinancialChartsProps {
  totalIncome: number;
  totalDebts: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalSavingsAccumulated: number;
  language: Language;
  chartType: ChartType;
}

export const EnhancedFinancialCharts = ({
  totalIncome,
  totalDebts,
  totalFixedExpenses,
  totalVariableExpenses,
  totalSavingsAccumulated,
  language,
  chartType
}: EnhancedFinancialChartsProps) => {
  const availableForSavings = totalIncome - (totalDebts + totalFixedExpenses + totalVariableExpenses);

  const motivationalMessages = {
    en: [
      { icon: Smile, text: "Every penny saved is a step towards your dreams!", color: "text-green-600" },
      { icon: Heart, text: "Your future self will thank you for today's decisions", color: "text-pink-600" },
      { icon: Target, text: "Small steps lead to big achievements", color: "text-blue-600" },
      { icon: TrendingUp, text: "You're building a stronger financial future", color: "text-purple-600" }
    ],
    es: [
      { icon: Smile, text: "¡Cada centavo ahorrado es un paso hacia tus sueños!", color: "text-green-600" },
      { icon: Heart, text: "Tu yo del futuro te agradecerá las decisiones de hoy", color: "text-pink-600" },
      { icon: Target, text: "Los pequeños pasos conducen a grandes logros", color: "text-blue-600" },
      { icon: TrendingUp, text: "Estás construyendo un futuro financiero más fuerte", color: "text-purple-600" }
    ],
    pt: [
      { icon: Smile, text: "Cada centavo economizado é um passo rumo aos seus sonhos!", color: "text-green-600" },
      { icon: Heart, text: "Seu eu do futuro agradecerá pelas decisões de hoje", color: "text-pink-600" },
      { icon: Target, text: "Pequenos passos levam a grandes conquistas", color: "text-blue-600" },
      { icon: TrendingUp, text: "Você está construindo um futuro financeiro mais forte", color: "text-purple-600" }
    ]
  };

  const randomMessage = motivationalMessages[language][Math.floor(Math.random() * motivationalMessages[language].length)];
  const MessageIcon = randomMessage.icon;

  const pieData = [
    { name: { en: 'Debts', es: 'Deudas', pt: 'Dívidas' }[language], value: totalDebts, color: 'hsl(var(--primary))' },
    { name: { en: 'Fixed Expenses', es: 'Gastos Fijos', pt: 'Despesas Fixas' }[language], value: totalFixedExpenses, color: 'hsl(var(--primary) / 0.7)' },
    { name: { en: 'Variable Expenses', es: 'Gastos Variables', pt: 'Despesas Variáveis' }[language], value: totalVariableExpenses, color: 'hsl(var(--primary) / 0.5)' },
    { name: { en: 'Accumulated Savings', es: 'Ahorros Acumulados', pt: 'Poupanças Acumuladas' }[language], value: totalSavingsAccumulated, color: 'hsl(var(--primary) / 0.3)' },
    { name: { en: 'Available', es: 'Disponible', pt: 'Disponível' }[language], value: Math.max(0, availableForSavings), color: 'hsl(var(--primary-glow))' }
  ].filter(item => item.value > 0);

  const barData = [
    {
      name: { en: 'Income', es: 'Ingresos', pt: 'Receitas' }[language],
      value: totalIncome,
      fill: 'hsl(var(--primary))'
    },
    {
      name: { en: 'Expenses', es: 'Gastos', pt: 'Despesas' }[language],
      value: totalDebts + totalFixedExpenses + totalVariableExpenses,
      fill: 'hsl(var(--primary) / 0.6)'
    },
    {
      name: { en: 'Accumulated Savings', es: 'Ahorros Acumulados', pt: 'Poupanças Acumuladas' }[language],
      value: totalSavingsAccumulated,
      fill: 'hsl(var(--primary-glow))'
    },
    {
      name: { en: 'Available', es: 'Disponible', pt: 'Disponível' }[language],
      value: Math.max(0, availableForSavings),
      fill: 'hsl(var(--primary) / 0.3)'
    }
  ];

  const timelineData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return {
      month: date.toLocaleDateString(language === 'en' ? 'en-GB' : language === 'es' ? 'es-ES' : 'pt-PT', { month: 'short' }),
      income: totalIncome * (0.9 + Math.random() * 0.2),
      expenses: (totalDebts + totalFixedExpenses + totalVariableExpenses) * (0.9 + Math.random() * 0.2),
    };
  });

  const renderChart = () => {
    const normalizedChart: ChartType = (chartType === 'bar' || chartType === 'pie' || chartType === 'timeline') ? chartType : 'bar';
    switch (normalizedChart) {
      case 'bar':
        return (
          <div className="space-y-4">
            <Card className="shadow-medium border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
              <CardHeader className="bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {{ en: 'Financial Overview', es: 'Resumen Financiero', pt: 'Resumo Financeiro' }[language]}
                  </CardTitle>
                </div>
                <CardDescription>
                  {{ en: 'Income, expenses, and available balance', es: 'Ingresos, gastos y saldo disponible', pt: 'Receitas, despesas e saldo disponível' }[language]}
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
            
            <Alert className="border-primary/30 bg-primary/5">
              <MessageIcon className={`h-5 w-5 ${randomMessage.color}`} />
              <AlertDescription className="text-base font-medium ml-2">
                {randomMessage.text}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {{ en: 'Total Income', es: 'Ingresos Totales', pt: 'Receita Total' }[language]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">£{totalIncome.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {{ en: 'Total Expenses', es: 'Gastos Totales', pt: 'Despesas Totais' }[language]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary/70">
                    £{(totalDebts + totalFixedExpenses + totalVariableExpenses).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary-glow/10 to-primary-glow/5 border-primary-glow/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {{ en: 'Available to Save', es: 'Disponible para Ahorrar', pt: 'Disponível para Poupar' }[language]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${availableForSavings >= 0 ? 'text-primary-glow' : 'text-destructive'} flex items-center gap-2`}>
                    {availableForSavings >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    £{Math.abs(availableForSavings).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'pie':
        return (
          <div className="space-y-4">
            <Card className="shadow-medium border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
              <CardHeader className="bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {{ en: 'Expense Distribution', es: 'Distribución de Gastos', pt: 'Distribuição de Despesas' }[language]}
                </CardTitle>
                <CardDescription>
                  {{ en: 'How your income is allocated', es: 'Cómo se distribuyen tus ingresos', pt: 'Como sua receita está alocada' }[language]}
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

            <Alert className="border-primary/30 bg-primary/5">
              <MessageIcon className={`h-5 w-5 ${randomMessage.color}`} />
              <AlertDescription className="text-base font-medium ml-2">
                {randomMessage.text}
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-4">
            <Card className="shadow-medium border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
              <CardHeader className="bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {{ en: 'Cash Flow Timeline', es: 'Línea de Tiempo de Flujo de Caja', pt: 'Linha do Tempo de Fluxo de Caixa' }[language]}
                </CardTitle>
                <CardDescription>
                  {{ en: '6-month cash flow trend', es: 'Tendencia de flujo de caja de 6 meses', pt: 'Tendência de fluxo de caixa de 6 meses' }[language]}
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
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                      animationDuration={800}
                      name={{ en: 'Income', es: 'Ingresos', pt: 'Receitas' }[language]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="hsl(var(--primary) / 0.5)" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary) / 0.5)', r: 5 }}
                      animationDuration={800}
                      name={{ en: 'Expenses', es: 'Gastos', pt: 'Despesas' }[language]}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Alert className="border-primary/30 bg-primary/5">
              <MessageIcon className={`h-5 w-5 ${randomMessage.color}`} />
              <AlertDescription className="text-base font-medium ml-2">
                {randomMessage.text}
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="w-full">{renderChart()}</div>;
};