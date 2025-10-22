import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, Trash2, Pencil, Calendar, TrendingUp } from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavingsGoal {
  id: string;
  goal_name: string;
  goal_description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
}

interface SavingsGoalsManagerProps {
  language: Language;
  availableForSavings: number;
}

export const SavingsGoalsManager = ({ language, availableForSavings }: SavingsGoalsManagerProps) => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  
  const [formData, setFormData] = useState({
    goal_name: "",
    goal_description: "",
    target_amount: "",
    current_amount: "",
    target_date: ""
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGoals(data);
    }
  };

  const resetForm = () => {
    setFormData({
      goal_name: "",
      goal_description: "",
      target_amount: "",
      current_amount: "",
      target_date: ""
    });
    setEditingGoal(null);
  };

  const handleSaveGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const goalData = {
      goal_name: formData.goal_name,
      goal_description: formData.goal_description,
      target_amount: parseFloat(formData.target_amount) || 0,
      current_amount: parseFloat(formData.current_amount) || 0,
      target_date: formData.target_date || null
    };

    if (editingGoal) {
      const { error } = await supabase
        .from('savings_goals')
        .update(goalData)
        .eq('id', editingGoal.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update goal", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Goal updated successfully" });
    } else {
      const { error } = await supabase
        .from('savings_goals')
        .insert({ ...goalData, user_id: user.id });

      if (error) {
        toast({ title: "Error", description: "Failed to create goal", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Goal created successfully" });
    }

    resetForm();
    setIsAddDialogOpen(false);
    loadGoals();
  };

  const handleDeleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete goal", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Goal deleted successfully" });
    loadGoals();
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      goal_name: goal.goal_name,
      goal_description: goal.goal_description || "",
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date || ""
    });
    setIsAddDialogOpen(true);
  };

  const calculateMonthsToGoal = (goal: SavingsGoal) => {
    const remaining = goal.target_amount - goal.current_amount;
    if (remaining <= 0 || availableForSavings <= 0) return 0;
    return Math.ceil(remaining / availableForSavings);
  };

  const calculateMonthlyAmount = (goal: SavingsGoal) => {
    if (!goal.target_date) return 0;
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const monthsRemaining = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const remaining = goal.target_amount - goal.current_amount;
    return remaining / monthsRemaining;
  };

  return (
    <Card className="shadow-medium">
      <CardHeader className="bg-gradient-primary text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <CardTitle>
              {language === 'en' ? 'Personalized Savings Goals' : 'Metas de Ahorro Personalizadas'}
            </CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Add Goal' : 'Añadir Meta'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGoal
                    ? (language === 'en' ? 'Edit Savings Goal' : 'Editar Meta de Ahorro')
                    : (language === 'en' ? 'New Savings Goal' : 'Nueva Meta de Ahorro')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Goal Name' : 'Nombre de la Meta'}</Label>
                  <Input
                    value={formData.goal_name}
                    onChange={(e) => setFormData({...formData, goal_name: e.target.value})}
                    placeholder={language === 'en' ? 'e.g., Vacation, House Down Payment' : 'ej., Vacaciones, Enganche de Casa'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Description (optional)' : 'Descripción (opcional)'}</Label>
                  <Input
                    value={formData.goal_description}
                    onChange={(e) => setFormData({...formData, goal_description: e.target.value})}
                    placeholder={language === 'en' ? 'Additional details' : 'Detalles adicionales'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Target Amount (£)' : 'Monto Objetivo (£)'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Current Amount (£)' : 'Monto Actual (£)'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({...formData, current_amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Target Date (optional)' : 'Fecha Objetivo (opcional)'}</Label>
                  <Input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                  />
                </div>
                <Button onClick={handleSaveGoal} className="w-full">
                  {editingGoal
                    ? (language === 'en' ? 'Update Goal' : 'Actualizar Meta')
                    : (language === 'en' ? 'Create Goal' : 'Crear Meta')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="text-primary-foreground/80">
          {language === 'en' 
            ? 'Create and track individual savings goals' 
            : 'Crea y monitorea metas de ahorro individuales'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Available for Savings */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {language === 'en' ? 'Available Monthly for Savings' : 'Disponible Mensual para Ahorros'}
          </p>
          <p className="text-2xl font-bold text-primary">£{availableForSavings.toFixed(2)}</p>
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {goals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {language === 'en' 
                ? 'No savings goals yet. Create one to get started!' 
                : '¡Aún no hay metas de ahorro. Crea una para comenzar!'}
            </p>
          ) : (
            goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const monthsToGoal = calculateMonthsToGoal(goal);
              const suggestedMonthly = goal.target_date ? calculateMonthlyAmount(goal) : 0;
              const remaining = goal.target_amount - goal.current_amount;

              return (
                <div key={goal.id} className="p-4 bg-secondary/50 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{goal.goal_name}</h4>
                      {goal.goal_description && (
                        <p className="text-sm text-muted-foreground">{goal.goal_description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditGoal(goal)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === 'en' ? 'Progress' : 'Progreso'}
                      </span>
                      <span className="font-medium">
                        £{goal.current_amount.toFixed(2)} / £{goal.target_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {progress.toFixed(1)}% {language === 'en' ? 'complete' : 'completo'}
                    </p>
                  </div>

                  {goal.target_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        {language === 'en' ? 'Target:' : 'Objetivo:'} {new Date(goal.target_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {language === 'en' ? 'Remaining' : 'Restante'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">£{remaining.toFixed(2)}</p>
                    </div>
                    {suggestedMonthly > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {language === 'en' ? 'Monthly needed' : 'Mensual necesario'}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          £{suggestedMonthly.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {monthsToGoal > 0 && !goal.target_date && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {language === 'en' ? 'Months to goal' : 'Meses para la meta'}
                        </p>
                        <p className="text-sm font-semibold text-success">
                          {monthsToGoal} {monthsToGoal === 1 
                            ? (language === 'en' ? 'month' : 'mes')
                            : (language === 'en' ? 'months' : 'meses')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};