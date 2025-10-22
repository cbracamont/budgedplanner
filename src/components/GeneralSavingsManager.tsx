import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PiggyBank, TrendingUp, CalendarDays } from "lucide-react";
import { formatCurrency, getTranslation, Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface GeneralSavingsManagerProps {
  language: Language;
  availableToSave: number;
}

export const GeneralSavingsManager = ({ language, availableToSave }: GeneralSavingsManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [totalAccumulated, setTotalAccumulated] = useState(0);
  const [savingsId, setSavingsId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [projectionMonths, setProjectionMonths] = useState<number>(12);

  const currentMonth = new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  useEffect(() => {
    loadSavings();
  }, []);

  const loadSavings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('savings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setSavingsId(data.id);
      setMonthlyGoal(data.monthly_goal.toString());
      setTotalAccumulated(data.total_accumulated);
      setGoalName(data.goal_name || "");
      setGoalDescription(data.goal_description || "");
    }
  };

  const updateSavings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const goalValue = parseFloat(monthlyGoal) || 0;

    if (savingsId) {
      const { error } = await supabase
        .from('savings')
        .update({ 
          monthly_goal: goalValue,
          goal_name: goalName,
          goal_description: goalDescription
        })
        .eq('id', savingsId);

      if (error) {
        toast({ title: "Error", description: "Failed to update savings goal", variant: "destructive" });
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('savings')
        .insert({ 
          user_id: user.id, 
          monthly_goal: goalValue,
          goal_name: goalName,
          goal_description: goalDescription
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: "Failed to create savings goal", variant: "destructive" });
        return;
      }

      setSavingsId(data.id);
    }

    toast({ title: "Success", description: "Savings goal updated successfully" });
    queryClient.invalidateQueries({ queryKey: ["savings"] });
  };

  const saveCurrentMonth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newTotal = totalAccumulated + availableToSave;
    await supabase
      .from('savings')
      .update({ total_accumulated: newTotal })
      .eq('id', savingsId);

    setTotalAccumulated(newTotal);
    toast({ title: "Success", description: "Monthly savings added to total" });
    queryClient.invalidateQueries({ queryKey: ["savings"] });
  };

  const generateProjections = () => {
    const monthlyGoalValue = parseFloat(monthlyGoal) || 0;
    const projections = [];
    let accumulated = totalAccumulated;
    
    for (let i = 1; i <= projectionMonths; i++) {
      accumulated += monthlyGoalValue;
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      
      projections.push({
        month: futureDate.toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { 
          month: 'long', 
          year: 'numeric' 
        }),
        monthlyAmount: monthlyGoalValue,
        accumulated: accumulated
      });
    }
    
    return projections;
  };

  return (
    <Card className="shadow-medium border-muted">
      <CardHeader className="bg-gradient-income text-income-foreground">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5" />
          <CardTitle>{language === 'en' ? 'General Savings' : 'Ahorros Generales'}</CardTitle>
        </div>
        <CardDescription className="text-income-foreground/80">
          {language === 'en' ? 'Manage your general savings goals' : 'Gestiona tus metas de ahorro general'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Available to Save */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              {language === 'en' ? `Available to Save - ${currentMonth}` : `Disponible para Ahorrar - ${currentMonth}`}
            </span>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${availableToSave >= 0 ? 'text-success' : 'text-destructive'}`}>
                £{availableToSave.toFixed(2)}
              </span>
              <Button onClick={saveCurrentMonth} size="sm">
                {language === 'en' ? 'Save This Month' : 'Guardar Este Mes'}
              </Button>
            </div>
          </div>
        </div>

        {/* Savings Goals Section */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <Label className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {language === 'en' ? 'Savings Goals' : 'Metas de Ahorro'}
          </Label>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="goal-name">
                {language === 'en' ? 'Savings Goal (e.g., Vacation, House, Education)' : 'Objetivo de Ahorro (ej. Vacaciones, Vivienda, Educación)'}
              </Label>
              <Input
                id="goal-name"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder={language === 'en' ? 'Enter your savings goal' : 'Ingresa tu objetivo de ahorro'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-description">
                {language === 'en' ? 'Goal Description' : 'Descripción del Objetivo'}
              </Label>
              <Input
                id="goal-description"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder={language === 'en' ? 'Optional details about your goal' : 'Detalles opcionales sobre tu objetivo'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-goal">
                {language === 'en' ? 'Monthly Savings Goal' : 'Meta de Ahorro Mensual'}
              </Label>
              <Input
                id="monthly-goal"
                type="number"
                step="0.01"
                value={monthlyGoal}
                onChange={(e) => setMonthlyGoal(e.target.value)}
                placeholder="0.00"
                className="text-lg font-medium"
              />
            </div>

            <Button onClick={updateSavings} className="w-full">
              {language === 'en' ? 'Save Goals' : 'Guardar Metas'}
            </Button>
          </div>
        </div>

        {/* Total Accumulated */}
        <div className="p-4 bg-gradient-income text-income-foreground rounded-lg">
          <div className="space-y-2">
            <p className="text-sm opacity-90">
              {language === 'en' ? 'Total Accumulated' : 'Total Acumulado'}
            </p>
            <p className="text-3xl font-bold">£{totalAccumulated.toFixed(2)}</p>
            {goalName && (
              <p className="text-sm opacity-80">
                {language === 'en' ? 'Goal:' : 'Objetivo:'} {goalName}
              </p>
            )}
          </div>
        </div>

        {/* Savings Projections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{language === 'en' ? 'Savings Projections' : 'Proyecciones de Ahorro'}</h3>
            </div>
            <Select value={projectionMonths.toString()} onValueChange={(v) => setProjectionMonths(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 {language === 'en' ? 'months' : 'meses'}</SelectItem>
                <SelectItem value="12">12 {language === 'en' ? 'months' : 'meses'}</SelectItem>
                <SelectItem value="24">24 {language === 'en' ? 'months' : 'meses'}</SelectItem>
                <SelectItem value="36">36 {language === 'en' ? 'months' : 'meses'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {generateProjections().map((projection, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{projection.month}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Monthly:' : 'Mensual:'} £{projection.monthlyAmount.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{language === 'en' ? 'Accumulated' : 'Acumulado'}</p>
                  <p className="font-bold text-success">£{projection.accumulated.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};