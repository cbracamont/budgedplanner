import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BarChart3 } from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export type ChartType = 'bar' | 'pie' | 'timeline';

interface ChartSettingsProps {
  language: Language;
  selectedChart: ChartType;
  onChartChange: (chart: ChartType) => void;
}

export const ChartSettings = ({ language, selectedChart, onChartChange }: ChartSettingsProps) => {
  
  useEffect(() => {
    saveChartPreference(selectedChart);
  }, [selectedChart]);

  const saveChartPreference = async (chartType: ChartType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('app_settings')
        .update({ chart_type: chartType })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('app_settings')
        .insert({ user_id: user.id, chart_type: chartType });
    }
  };

  const chartOptions = [
    { 
      value: 'bar' as ChartType, 
      label: { en: 'Bar Chart by Category', es: 'Gráfico de Barras por Categoría', pt: 'Gráfico de Barras por Categoria' }[language],
      description: { en: 'Compare income vs expenses', es: 'Compara ingresos vs gastos', pt: 'Compare receitas vs despesas' }[language]
    },
    { 
      value: 'pie' as ChartType, 
      label: { en: 'Pie Chart (Income vs Expenses)', es: 'Gráfico de Pastel (Ingresos vs Egresos)', pt: 'Gráfico de Pizza (Receitas vs Despesas)' }[language],
      description: { en: 'View expense distribution', es: 'Ver distribución de gastos', pt: 'Ver distribuição de despesas' }[language]
    },
    { 
      value: 'timeline' as ChartType, 
      label: { en: 'Cash Flow Timeline', es: 'Línea de Tiempo de Flujo de Caja', pt: 'Linha do Tempo de Fluxo de Caixa' }[language],
      description: { en: 'Track monthly cash flow', es: 'Seguimiento del flujo mensual', pt: 'Acompanhe o fluxo mensal' }[language]
    }
  ];

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>
            {{ en: 'Chart Visualization', es: 'Visualización Financiera', pt: 'Visualização de Gráficos' }[language]}
          </CardTitle>
        </div>
        <CardDescription>
          {{
            en: 'Choose how to display your financial data',
            es: 'Elige cómo mostrar tus datos financieros',
            pt: 'Escolha como exibir seus dados financeiros'
          }[language]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedChart} onValueChange={(value) => onChartChange(value as ChartType)}>
          <div className="space-y-3">
            {chartOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="font-normal cursor-pointer flex-1">
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};