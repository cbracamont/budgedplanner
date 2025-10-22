import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BarChart3 } from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export type ChartType = 'bar' | 'pie' | 'timeline' | 'heatmap';

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
      label: language === 'en' ? 'Bar Chart by Category' : 'Gráfico de Barras por Categoría',
      description: language === 'en' ? 'Compare income vs expenses' : 'Compara ingresos vs gastos'
    },
    { 
      value: 'pie' as ChartType, 
      label: language === 'en' ? 'Pie Chart (Income vs Expenses)' : 'Gráfico de Pastel (Ingresos vs Egresos)',
      description: language === 'en' ? 'View expense distribution' : 'Ver distribución de gastos'
    },
    { 
      value: 'timeline' as ChartType, 
      label: language === 'en' ? 'Cash Flow Timeline' : 'Línea de Tiempo de Flujo de Caja',
      description: language === 'en' ? 'Track monthly cash flow' : 'Seguimiento del flujo mensual'
    },
    { 
      value: 'heatmap' as ChartType, 
      label: language === 'en' ? 'Monthly Expense Heatmap' : 'Mapa de Calor Mensual de Gastos',
      description: language === 'en' ? 'Visualize spending patterns' : 'Visualiza patrones de gasto'
    }
  ];

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>
            {language === 'en' ? 'Chart Visualization' : 'Visualización Financiera'}
          </CardTitle>
        </div>
        <CardDescription>
          {language === 'en' 
            ? 'Choose how to display your financial data' 
            : 'Elige cómo mostrar tus datos financieros'}
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