import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, TrendingUp, Edit2 } from "lucide-react";
import { getTranslation, Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface SavingsManagerProps {
  language: Language;
  availableToSave: number;
}

export const SavingsManager = ({ language, availableToSave }: SavingsManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [totalAccumulated, setTotalAccumulated] = useState(0);
  const [savingsId, setSavingsId] = useState<string | null>(null);
  const [customSavingsAmount, setCustomSavingsAmount] = useState("");
  const [isEditingAccumulated, setIsEditingAccumulated] = useState(false);
  const [editAccumulatedValue, setEditAccumulatedValue] = useState("");

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
    }
  };

  const updateSavings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const goalValue = parseFloat(monthlyGoal) || 0;

    if (savingsId) {
      const { error } = await supabase
        .from('savings')
        .update({ monthly_goal: goalValue })
        .eq('id', savingsId);

      if (error) {
        toast({ title: "Error", description: "Failed to update savings goal", variant: "destructive" });
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('savings')
        .insert({ user_id: user.id, monthly_goal: goalValue })
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

  const addToSavings = async () => {
    if (!savingsId) return;

    const goalValue = parseFloat(monthlyGoal) || 0;
    const newTotal = totalAccumulated + goalValue;

    const { error } = await supabase
      .from('savings')
      .update({ total_accumulated: newTotal })
      .eq('id', savingsId);

    if (error) {
      toast({ title: "Error", description: "Failed to add to savings", variant: "destructive" });
      return;
    }

    setTotalAccumulated(newTotal);
    toast({ title: "Success", description: "Monthly savings added to total" });
    queryClient.invalidateQueries({ queryKey: ["savings"] });
  };

  const updateAccumulated = async () => {
    if (!savingsId) return;

    const newValue = parseFloat(editAccumulatedValue) || 0;

    const { error } = await supabase
      .from('savings')
      .update({ total_accumulated: newValue })
      .eq('id', savingsId);

    if (error) {
      toast({ title: "Error", description: "Failed to update accumulated savings", variant: "destructive" });
      return;
    }

    setTotalAccumulated(newValue);
    setIsEditingAccumulated(false);
    toast({ title: "Success", description: "Accumulated savings updated successfully" });
    queryClient.invalidateQueries({ queryKey: ["savings"] });
  };

  const savingsProgress = monthlyGoal ? (parseFloat(customSavingsAmount || "0") / parseFloat(monthlyGoal)) * 100 : 0;

  return (
    <Card className="shadow-medium border-muted">
      <CardHeader className="bg-gradient-income text-income-foreground">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5" />
          <CardTitle>{language === 'en' ? 'Savings' : 'Ahorros'}</CardTitle>
        </div>
        <CardDescription className="text-income-foreground/80">
          {language === 'en' ? 'Manage your savings goals' : 'Gestiona tus metas de ahorro'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Available to Save */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {language === 'en' ? 'Available to Save This Month' : 'Disponible para Ahorrar Este Mes'}
            </span>
            <span className={`text-2xl font-bold ${availableToSave >= 0 ? 'text-success' : 'text-destructive'}`}>
              £{availableToSave.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Custom Amount to Save This Month */}
        <div className="space-y-3">
          <Label htmlFor="custom-savings" className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {language === 'en' ? 'Amount to Save This Month' : 'Monto a Ahorrar Este Mes'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="custom-savings"
              type="number"
              step="0.01"
              value={customSavingsAmount}
              onChange={(e) => setCustomSavingsAmount(e.target.value)}
              placeholder={availableToSave.toFixed(2)}
              className="text-lg font-medium"
            />
            <Button onClick={() => setCustomSavingsAmount(availableToSave.toFixed(2))} variant="outline">
              {language === 'en' ? 'Use Available' : 'Usar Disponible'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === 'en' 
              ? 'This amount will be deducted from your monthly budget' 
              : 'Este monto será descontado de tu presupuesto mensual'}
          </p>
        </div>

        {/* Monthly Goal */}
        <div className="space-y-3">
          <Label htmlFor="monthly-goal" className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {language === 'en' ? 'Monthly Savings Goal' : 'Meta de Ahorro Mensual'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="monthly-goal"
              type="number"
              step="0.01"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(e.target.value)}
              placeholder="0.00"
              className="text-lg font-medium"
            />
            <Button onClick={updateSavings}>
              {language === 'en' ? 'Set Goal' : 'Establecer Meta'}
            </Button>
          </div>
        </div>

        {/* Savings Progress */}
        {parseFloat(monthlyGoal) > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {language === 'en' ? 'Savings Progress This Month' : 'Progreso de Ahorro Este Mes'}
              </Label>
              <span className="text-sm text-muted-foreground">
                {savingsProgress.toFixed(0)}%
              </span>
            </div>
            <Progress value={savingsProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>£{parseFloat(customSavingsAmount || "0").toFixed(2)}</span>
              <span>£{parseFloat(monthlyGoal).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Total Accumulated */}
        <div className="p-4 bg-gradient-income text-income-foreground rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm opacity-90">
                {language === 'en' ? 'Total Accumulated' : 'Total Acumulado'}
              </p>
              {!isEditingAccumulated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingAccumulated(true);
                    setEditAccumulatedValue(totalAccumulated.toString());
                  }}
                  className="text-income-foreground hover:bg-income-foreground/20"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isEditingAccumulated ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={editAccumulatedValue}
                  onChange={(e) => setEditAccumulatedValue(e.target.value)}
                  className="text-lg font-medium bg-income-foreground/20 text-income-foreground border-income-foreground/30"
                />
                <Button
                  onClick={updateAccumulated}
                  variant="secondary"
                  size="sm"
                >
                  {language === 'en' ? 'Save' : 'Guardar'}
                </Button>
                <Button
                  onClick={() => setIsEditingAccumulated(false)}
                  variant="ghost"
                  size="sm"
                  className="text-income-foreground hover:bg-income-foreground/20"
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </Button>
              </div>
            ) : (
              <p className="text-3xl font-bold">£{totalAccumulated.toFixed(2)}</p>
            )}
          </div>
        </div>

        {/* Add Monthly Savings */}
        {parseFloat(monthlyGoal) > 0 && (
          <Button 
            onClick={addToSavings} 
            className="w-full"
            variant="outline"
          >
            {language === 'en' 
              ? `Add £${parseFloat(monthlyGoal).toFixed(2)} to Savings` 
              : `Añadir £${parseFloat(monthlyGoal).toFixed(2)} a Ahorros`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};