import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp } from "lucide-react";
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

        {/* Total Accumulated */}
        <div className="p-4 bg-gradient-income text-income-foreground rounded-lg">
          <div className="space-y-2">
            <p className="text-sm opacity-90">
              {language === 'en' ? 'Total Accumulated' : 'Total Acumulado'}
            </p>
            <p className="text-3xl font-bold">£{totalAccumulated.toFixed(2)}</p>
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