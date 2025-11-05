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
  const savingsProgress = monthlyGoal ? parseFloat(monthlyGoal) / parseFloat(monthlyGoal) * 100 : 0;
  return <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-primary" />
          <CardTitle>
            {language === 'en' ? 'General Savings' : 'Ahorros Generales'}
          </CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Track your monthly savings goal and accumulated total' : 'Rastrea tu meta mensual de ahorro y total acumulado'}
        </CardDescription>
      </CardHeader>
      
    </Card>;
};