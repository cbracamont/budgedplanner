import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, Plus, Minus, TrendingUp } from "lucide-react";
import { Language } from "@/lib/i18n";
import { formatCurrency } from "@/lib/i18n";
import { useSavings, useUpdateSavings } from "@/hooks/useFinancialData";
import { useToast } from "@/hooks/use-toast";

interface GeneralSavingsTrackerProps {
  language: Language;
}

export const GeneralSavingsTracker = ({ language }: GeneralSavingsTrackerProps) => {
  const { toast } = useToast();
  const { data: savings } = useSavings();
  const updateSavingsMutation = useUpdateSavings();

  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");

  useEffect(() => {
    if (savings) {
      setMonthlyGoal(savings.monthly_goal?.toString() || "0");
    }
  }, [savings]);

  const t = {
    en: {
      title: "General Savings",
      description: "Track your general monthly savings and accumulated amount",
      totalSaved: "Total Saved",
      monthlyGoal: "Monthly Goal",
      progress: "This Month's Progress",
      addMoney: "Add Money",
      withdraw: "Withdraw",
      updateGoal: "Update Goal",
      add: "Add",
      remove: "Remove",
    },
    es: {
      title: "Ahorros Generales",
      description: "Rastrea tus ahorros mensuales generales y el monto acumulado",
      totalSaved: "Total Ahorrado",
      monthlyGoal: "Meta Mensual",
      progress: "Progreso del Mes",
      addMoney: "Añadir Dinero",
      withdraw: "Retirar",
      updateGoal: "Actualizar Meta",
      add: "Añadir",
      remove: "Retirar",
    },
    pl: {
      title: "Ogólne Oszczędności",
      description: "Śledź swoje miesięczne oszczędności i zgromadzoną kwotę",
      totalSaved: "Całkowite Oszczędności",
      monthlyGoal: "Miesięczny Cel",
      progress: "Postęp w tym miesiącu",
      addMoney: "Dodaj Pieniądze",
      withdraw: "Wypłać",
      updateGoal: "Aktualizuj Cel",
      add: "Dodaj",
      remove: "Usuń",
    },
  }[language];

  const currentAmount = savings?.total_accumulated || 0;
  const goal = parseFloat(monthlyGoal) || 0;
  const progressPercent = goal > 0 ? Math.min(100, (currentAmount / goal) * 100) : 0;

  const handleAddMoney = () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const newTotal = currentAmount + amount;
    updateSavingsMutation.mutate({
      total_accumulated: newTotal,
      monthly_goal: goal,
    });
    setAddAmount("");
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > currentAmount) {
      toast({
        title: "Error",
        description: "Insufficient funds",
        variant: "destructive",
      });
      return;
    }

    const newTotal = currentAmount - amount;
    updateSavingsMutation.mutate({
      total_accumulated: newTotal,
      monthly_goal: goal,
    });
    setWithdrawAmount("");
  };

  const handleUpdateGoal = () => {
    const newGoal = parseFloat(monthlyGoal);
    if (newGoal < 0) {
      toast({
        title: "Error",
        description: "Goal cannot be negative",
        variant: "destructive",
      });
      return;
    }

    updateSavingsMutation.mutate({
      total_accumulated: currentAmount,
      monthly_goal: newGoal,
    });
  };

  return (
    <Card className="shadow-lg border-2 border-primary/20">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
            <PiggyBank className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              {t.title}
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Total Saved Display */}
        <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
          <p className="text-sm font-medium text-muted-foreground mb-2">{t.totalSaved}</p>
          <p className="text-4xl font-bold text-primary">{formatCurrency(currentAmount)}</p>
        </div>

        {/* Monthly Goal */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t.monthlyGoal}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(e.target.value)}
              placeholder="0.00"
              className="flex-1"
            />
            <Button onClick={handleUpdateGoal} variant="outline">
              {t.updateGoal}
            </Button>
          </div>
        </div>

        {/* Progress */}
        {goal > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{t.progress}</span>
              <span className="text-muted-foreground">{progressPercent.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(currentAmount)}</span>
              <span>{formatCurrency(goal)}</span>
            </div>
          </div>
        )}

        {/* Add Money */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-base font-semibold">{t.addMoney}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1"
            />
            <Button onClick={handleAddMoney} className="gap-2">
              <Plus className="h-4 w-4" />
              {t.add}
            </Button>
          </div>
        </div>

        {/* Withdraw */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t.withdraw}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1"
            />
            <Button onClick={handleWithdraw} variant="destructive" className="gap-2">
              <Minus className="h-4 w-4" />
              {t.remove}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
