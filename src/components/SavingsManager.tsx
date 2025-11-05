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
export const SavingsManager = ({
  language,
  availableToSave
}: SavingsManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const {
    toast
  } = useToast();
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
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('savings').select('*').eq('user_id', user.id).maybeSingle();
    if (!error && data) {
      setSavingsId(data.id);
      setMonthlyGoal(data.monthly_goal.toString());
      setTotalAccumulated(data.total_accumulated);
    }
  };
  const updateSavings = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const goalValue = parseFloat(monthlyGoal) || 0;
    if (savingsId) {
      const {
        error
      } = await supabase.from('savings').update({
        monthly_goal: goalValue
      }).eq('id', savingsId);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update savings goal",
          variant: "destructive"
        });
        return;
      }
    } else {
      const {
        data,
        error
      } = await supabase.from('savings').insert({
        user_id: user.id,
        monthly_goal: goalValue
      }).select().single();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to create savings goal",
          variant: "destructive"
        });
        return;
      }
      setSavingsId(data.id);
    }
    toast({
      title: "Success",
      description: "Savings goal updated successfully"
    });
    queryClient.invalidateQueries({
      queryKey: ["savings"]
    });
  };
  const addToSavings = async () => {
    if (!savingsId) return;
    const goalValue = parseFloat(monthlyGoal) || 0;
    const newTotal = totalAccumulated + goalValue;
    const {
      error
    } = await supabase.from('savings').update({
      total_accumulated: newTotal
    }).eq('id', savingsId);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to add to savings",
        variant: "destructive"
      });
      return;
    }
    setTotalAccumulated(newTotal);
    toast({
      title: "Success",
      description: "Monthly savings added to total"
    });
    queryClient.invalidateQueries({
      queryKey: ["savings"]
    });
  };
  const updateAccumulated = async () => {
    if (!savingsId) return;
    const newValue = parseFloat(editAccumulatedValue) || 0;
    const {
      error
    } = await supabase.from('savings').update({
      total_accumulated: newValue
    }).eq('id', savingsId);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update accumulated savings",
        variant: "destructive"
      });
      return;
    }
    setTotalAccumulated(newValue);
    setIsEditingAccumulated(false);
    toast({
      title: "Success",
      description: "Accumulated savings updated successfully"
    });
    queryClient.invalidateQueries({
      queryKey: ["savings"]
    });
  };
  const savingsProgress = monthlyGoal ? (parseFloat(monthlyGoal) / parseFloat(monthlyGoal)) * 100 : 0;
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-primary" />
          <CardTitle>
            {language === 'en' ? 'General Savings' : 'Ahorros Generales'}
          </CardTitle>
        </div>
        <CardDescription>
          {language === 'en' 
            ? 'Track your monthly savings goal and accumulated total' 
            : 'Rastrea tu meta mensual de ahorro y total acumulado'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Monthly Savings Goal */}
        <div className="space-y-2">
          <Label htmlFor="monthly-goal">
            {language === 'en' ? 'Monthly Savings Contribution' : 'Aporte Mensual de Ahorro'}
          </Label>
          <Input
            id="monthly-goal"
            type="number"
            step="0.01"
            value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(e.target.value)}
            placeholder="0.00"
          />
          <p className="text-sm text-muted-foreground">
            {language === 'en' 
              ? 'This amount will be automatically deducted from your monthly balance' 
              : 'Esta cantidad se deducirá automáticamente de tu balance mensual'}
          </p>
        </div>

        <Button onClick={updateSavings} className="w-full">
          {language === 'en' ? 'Save Monthly Goal' : 'Guardar Meta Mensual'}
        </Button>

        {/* Savings Progress This Month */}
        {parseFloat(monthlyGoal) > 0 && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">
                {language === 'en' ? 'Monthly Savings Progress' : 'Progreso de Ahorro Mensual'}
              </Label>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'en' ? 'Goal for this month' : 'Meta para este mes'}
                </span>
                <span className="font-semibold">
                  £{parseFloat(monthlyGoal).toFixed(2)}
                </span>
              </div>
              <Progress value={savingsProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {language === 'en'
                  ? 'This amount is being saved automatically each month'
                  : 'Esta cantidad se está ahorrando automáticamente cada mes'}
              </p>
            </div>
          </div>
        )}

        {/* Total Accumulated */}
        <div className="space-y-2">
          <Label>
            {language === 'en' ? 'Total Accumulated Savings' : 'Total Acumulado de Ahorros'}
          </Label>
          {isEditingAccumulated ? (
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                value={editAccumulatedValue}
                onChange={(e) => setEditAccumulatedValue(e.target.value)}
                placeholder="0.00"
              />
              <Button onClick={updateAccumulated} size="sm">
                {language === 'en' ? 'Save' : 'Guardar'}
              </Button>
              <Button 
                onClick={() => setIsEditingAccumulated(false)} 
                variant="outline" 
                size="sm"
              >
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-success/10 to-success/5 rounded-lg border-l-4 border-success">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Total saved so far' : 'Total ahorrado hasta ahora'}
                </p>
                <p className="text-2xl font-bold text-success">
                  £{totalAccumulated.toFixed(2)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditAccumulatedValue(totalAccumulated.toString());
                  setIsEditingAccumulated(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Add Monthly Contribution to Total */}
        {parseFloat(monthlyGoal) > 0 && savingsId && (
          <Button 
            onClick={addToSavings} 
            variant="outline" 
            className="w-full"
          >
            {language === 'en' 
              ? `Add £${parseFloat(monthlyGoal).toFixed(2)} to Total` 
              : `Agregar £${parseFloat(monthlyGoal).toFixed(2)} al Total`}
          </Button>
        )}

        {/* Available After Savings */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            {language === 'en' ? 'Available After Savings Contribution' : 'Disponible Después del Aporte'}
          </p>
          <p className={`text-xl font-bold ${availableToSave >= 0 ? 'text-success' : 'text-destructive'}`}>
            £{availableToSave.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};