import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, Trash2, Pencil, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  useSavingsGoals,
  useAddSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
} from "@/hooks/useFinancialData";

interface SavingsGoal {
  id: string;
  goal_name: string;
  goal_description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  monthly_contribution?: number;
  is_active?: boolean;
}

interface SavingsGoalsManagerProps {
  language: Language;
  availableForSavings: number;
  availableBudget: number;
  onBudgetAllocation?: (allocatedAmount: number) => void;
}

export const SavingsGoalsManager = ({
  language,
  availableForSavings,
  availableBudget,
  onBudgetAllocation,
}: SavingsGoalsManagerProps) => {
  const { toast } = useToast();
  const { data: goals = [] } = useSavingsGoals();
  const addGoalMutation = useAddSavingsGoal();
  const updateGoalMutation = useUpdateSavingsGoal();
  const deleteGoalMutation = useDeleteSavingsGoal();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [formData, setFormData] = useState({
    goal_name: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
  });

  const resetForm = () => {
    setFormData({
      goal_name: "",
      target_amount: "",
      current_amount: "",
      target_date: "",
    });
    setEditingGoal(null);
  };

  const handleSaveGoal = async () => {
    const goalData = {
      goal_name: formData.goal_name,
      target_amount: parseFloat(formData.target_amount) || 0,
      current_amount: parseFloat(formData.current_amount) || 0,
      target_date: formData.target_date || null,
    };

    if (editingGoal) {
      updateGoalMutation.mutate(
        {
          id: editingGoal.id,
          ...goalData,
        },
        {
          onSuccess: () => {
            resetForm();
            setIsAddDialogOpen(false);
          },
        },
      );
    } else {
      addGoalMutation.mutate(goalData, {
        onSuccess: () => {
          resetForm();
          setIsAddDialogOpen(false);
        },
      });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    deleteGoalMutation.mutate(id);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      goal_name: goal.goal_name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date || "",
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
    const monthsRemaining = Math.max(
      1,
      Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    );
    const remaining = goal.target_amount - goal.current_amount;
    return remaining / monthsRemaining;
  };

  const activateGoalContribution = async (goalId: string, monthlyAmount: number) => {
    updateGoalMutation.mutate(
      {
        id: goalId,
        monthly_contribution: monthlyAmount,
        is_active: true,
      },
      {
        onSuccess: () => {
          toast({
            title: language === "en" ? "Success" : "Éxito",
            description:
              language === "en"
                ? `Monthly contribution of £${monthlyAmount.toFixed(2)} activated`
                : `Aporte mensual de £${monthlyAmount.toFixed(2)} activado`,
          });

          if (onBudgetAllocation) {
            const totalAllocated = goals.reduce((sum, g) => sum + (g.monthly_contribution || 0), monthlyAmount);
            onBudgetAllocation(totalAllocated);
          }
        },
      },
    );
  };

  return (
    <Card className="shadow-medium">
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, Trash2, Pencil, Calendar, TrendingUp, CheckCircle2, AlertCircle, TrendingDown, TrendingUp as TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  useSavingsGoals,
  useAddSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
} from "@/hooks/useFinancialData";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInMonths, isPast, isToday } from "date-fns";
import { formatCurrency } from "@/lib/i18n";

interface SavingsGoal {
  id: string;
  goal_name: string;
  goal_description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  monthly_contribution?: number;
  is_active?: boolean;
}

interface SavingsGoalsManagerProps {
  language: Language;
  availableForSavings: number;
  availableBudget: number;
  onBudgetAllocation?: (allocatedAmount: number) => void;
}

export const SavingsGoalsManager = ({
  language,
  availableForSavings,
  availableBudget,
  onBudgetAllocation,
}: SavingsGoalsManagerProps) => {
  const { toast } = useToast();
  const { data: goals = [] } = useSavingsGoals();
  const addGoalMutation = useAddSavingsGoal();
  const updateGoalMutation = useUpdateSavingsGoal();
  const deleteGoalMutation = useDeleteSavingsGoal();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState({
    goal_name: "",
    goal_description: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  const t = {
    en: {
      title: "Savings Goals",
    },
    es: {
      title: "Metas de Ahorro",
    },
    pl: {
      title: "Cele Oszczędnościowe",
    },
  }[language];

  // Sophisticated calculations
  const getGoalStatus = (goal: SavingsGoal) => {
    const progress = (goal.current_amount / goal.target_amount) * 100;
    const monthsRemaining = goal.target_date ? differenceInMonths(new Date(goal.target_date), new Date()) : null;
    const onTrack = monthsRemaining && goal.monthly_contribution ? goal.monthly_contribution * monthsRemaining >= goal.target_amount - goal.current_amount : progress > 50;

    if (progress >= 100) return { status: "complete", color: "bg-green-100 text-green-800", icon: CheckCircle2, label: "Complete" };
    if (onTrack) return { status: "on-track", color: "bg-blue-100 text-blue-800", icon: TrendingUpIcon, label: "On Track" };
    if (progress > 25) return { status: "behind", color: "bg-yellow-100 text-yellow-800", icon: TrendingUpIcon, label: "Behind" };
    return { status: "critical", color: "bg-red-100 text-red-800", icon: TrendingDown, label: "Critical" };
  };

  const getROIEstimate = (goal: SavingsGoal, assumedRate = 0.05) => {
    const remaining = goal.target_amount - goal.current_amount;
    const months = goal.monthly_contribution ? Math.ceil(remaining / goal.monthly_contribution) : 12;
    const years = months / 12;
    const futureValue = remaining * Math.pow(1 + assumedRate, years);
    return Math.round((futureValue - remaining) / remaining * 100);
  };

  const resetForm = () => {
    setFormData({
      goal_name: "",
      goal_description: "",
      target_amount: "",
      current_amount: "",
      target_date: "",
      priority: "medium",
    });
    setEditingGoal(null);
  };

  const handleSaveGoal = async () => {
    if (!formData.goal_name || !formData.target_amount || parseFloat(formData.target_amount) <= 0) {
      toast({
        title: "Error",
        description: "Name and target amount are required.",
        variant: "destructive",
      });
      return;
    }

    const goalData = {
      goal_name: formData.goal_name,
      goal_description: formData.goal_description || null,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount) || 0,
      target_date: formData.target_date || null,
      priority: formData.priority,
    };

    if (editingGoal) {
      updateGoalMutation.mutate(
        { id: editingGoal.id, ...goalData },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Goal updated successfully.",
            });
            resetForm();
            setIsAddDialogOpen(false);
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: error.message || "Failed to update goal.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      addGoalMutation.mutate(goalData, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Goal created successfully.",
          });
          resetForm();
          setIsAddDialogOpen(false);
          if (onBudgetAllocation) onBudgetAllocation(0); // Reset allocation
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to create goal.",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    deleteGoalMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Goal deleted successfully.",
        });
        if (onBudgetAllocation) onBudgetAllocation(0); // Reset allocation
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete goal.",
          variant: "destructive",
        });
      },
    });
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      goal_name: goal.goal_name,
      goal_description: goal.goal_description || "",
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date || "",
      priority: goal.priority || "medium",
    });
    setIsAddDialogOpen(true);
  };

  const activateGoalContribution = async (goalId: string, monthlyAmount: number) => {
    if (monthlyAmount > availableBudget) {
      toast({
        title: "Insufficient Budget",
        description: "Monthly contribution exceeds available budget.",
        variant: "destructive",
      });
      return;
    }

    updateGoalMutation.mutate(
      { id: goalId, monthly_contribution: monthlyAmount, is_active: true },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: `Monthly contribution of ${formatCurrency(monthlyAmount)} activated.`,
          });
          if (onBudgetAllocation) {
            const totalAllocated = goals.reduce((sum, g) => sum + (g.monthly_contribution || 0), monthlyAmount);
            onBudgetAllocation(totalAllocated);
          }
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to activate contribution.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Create and track individual savings goals with progress tracking and automatic monthly contributions."
                  : "Crea y monitorea metas de ahorro individuales con seguimiento de progreso y aportes mensuales automáticos."}
              </CardDescription>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                {language === "en" ? "Add Goal" : "Añadir Meta"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal
                    ? language === "en" ? "Edit Savings Goal" : "Editar Meta de Ahorro"
                    : language === "en" ? "New Savings Goal" : "Nueva Meta de Ahorro"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === "en" ? "Goal Name" : "Nombre de la Meta"}</Label>
                  <Input
                    value={formData.goal_name}
                    onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
                    placeholder={language === "en" ? "e.g., Vacation, House Down Payment" : "ej., Vacaciones, Enganche de Casa"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "Description (optional)" : "Descripción (opcional)"}</Label>
                  <Textarea
                    value={formData.goal_description}
                    onChange={(e) => setFormData({ ...formData, goal_description: e.target.value })}
                    placeholder={language === "en" ? "What is this goal for? When do you want to achieve it?" : "Para qué es esta meta? ¿Cuándo quieres lograrla?"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "en" ? "Current Savings (£)" : "Ahorros Actuales (£)"}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "en" ? "Target Amount (£)" : "Monto Objetivo (£)"}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "Target Date (optional)" : "Fecha Objetivo (opcional)"}</Label>
                  <Input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "Priority" : "Prioridad"}</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as "low" | "medium" | "high" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveGoal} className="w-full">
                  {editingGoal
                    ? language === "en" ? "Update Goal" : "Actualizar Meta"
                    : language === "en" ? "Create Goal" : "Crear Meta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Available for Savings - Enhanced */}
        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-l-4 border-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-full">
                <PiggyBank className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800">Available Monthly for Savings</p>
                <p className="text-2xl font-bold text-emerald-900">{formatCurrency(availableForSavings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals List with Sophisticated Cards */}
        <div className="space-y-4">
          {goals.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200 dark:border-slate-700">
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium">{language === "en" ? "No savings goals yet" : "Aún no hay metas de ahorro"}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{language === "en" ? "Create your first goal to get started!" : "¡Crea tu primera meta para comenzar!"}</p>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const monthsToGoal = goal.target_date ? differenceInMonths(new Date(goal.target_date), new Date()) : null;
              const suggestedMonthly = goal.target_date ? (goal.target_amount - goal.current_amount) / monthsToGoal : 0;
              const status = getGoalStatus(goal);
              const roi = getROIEstimate(goal);
              const isUrgent = isPast(new Date(goal.target_date || '')) || (monthsToGoal && monthsToGoal < 3);
              const remaining = goal.target_amount - goal.current_amount;

              return (
                <Card key={goal.id} className={`relative overflow-hidden ${status.color} border-l-4 ${isUrgent ? 'border-orange-500 shadow-md' : 'shadow-sm'}`}>
                  {isUrgent && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant="destructive" className="text-xs">Urgent</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${status.color} flex-shrink-0`}>
                          {status.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{goal.goal_name}</h3>
                          <p className="text-sm text-muted-foreground">{goal.goal_description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditGoal(goal)} className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal.id)} className="h-8 w-8 p-0 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Donut Chart - Sophisticated */}
                    <div className="relative flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-slate-700" />
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke={status.color.replace('text-', 'border-')}
                            strokeWidth="2"
                            strokeDasharray={`${progress}, 100`}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{progress.toFixed(0)}%</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{language === "en" ? "Progress" : "Progreso"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="overflow-hidden rounded-lg border">
                      <table className="w-full">
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          <tr>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Current Amount</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(goal.current_amount)}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Target Amount</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(goal.target_amount)}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Remaining</td>
                            <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(remaining)}</td>
                          </tr>
                          {goal.target_date && (
                            <tr>
                              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Months to Goal</td>
                              <td className="px-4 py-3 text-right font-semibold">{monthsToGoal} months</td>
                            </tr>
                          )}
                          {suggestedMonthly > 0 && (
                            <tr>
                              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Suggested Monthly</td>
                              <td className="px-4 py-3 text-right font-semibold text-blue-600">{formatCurrency(suggestedMonthly)}</td>
                            </tr>
                          )}
                          {roi > 0 && (
                            <tr>
                              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Estimated ROI</td>
                              <td className="px-4 py-3 text-right font-semibold text-green-600">+{roi}%</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                      {goal.is_active ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Active monthly contribution: {formatCurrency(goal.monthly_contribution || 0)}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="text-sm text-muted-foreground">
                            {language === "en" ? "Not active. Set monthly contribution to automate savings." : "No activo. Establece una contribución mensual para automatizar los ahorros."}
                          </p>
                          {suggestedMonthly > 0 && (
                            <Button
                              variant="outline"
                              onClick={() => activateGoalContribution(goal.id, suggestedMonthly)}
                              disabled={suggestedMonthly > availableBudget}
                              className="w-full sm:w-auto"
                            >
                              {suggestedMonthly > availableBudget
                                ? language === "en" ? "Insufficient Budget" : "Presupuesto Insuficiente"
                                : language === "en" ? "Activate Monthly Contribution" : "Activar Contribución Mensual"
                              }
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
      <CardContent className="pt-6 space-y-4">
        {/* Available for Savings */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {language === "en" ? "Available Monthly for Savings" : "Disponible Mensual para Ahorros"}
          </p>
          <p className="text-2xl font-bold text-primary">£{availableForSavings.toFixed(2)}</p>
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {goals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {language === "en"
                ? "No savings goals yet. Create one to get started!"
                : "¡Aún no hay metas de ahorro. Crea una para comenzar!"}
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{goal.goal_name}</h4>
                        {goal.is_active && (
                          <Badge variant="default" className="bg-success text-success-foreground">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {language === "en" ? "Active" : "Activo"}
                          </Badge>
                        )}
                      </div>
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
                      <span className="text-muted-foreground">{language === "en" ? "Progress" : "Progreso"}</span>
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
                      {progress.toFixed(1)}% {language === "en" ? "complete" : "completo"}
                    </p>
                  </div>

                  {goal.target_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        {language === "en" ? "Target:" : "Objetivo:"} {new Date(goal.target_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{language === "en" ? "Remaining" : "Restante"}</p>
                      </div>
                      <p className="text-sm font-semibold">£{remaining.toFixed(2)}</p>
                    </div>
                    {suggestedMonthly > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {language === "en" ? "Monthly needed" : "Mensual necesario"}
                        </p>
                        <p className="text-sm font-semibold text-primary">£{suggestedMonthly.toFixed(2)}</p>
                      </div>
                    )}
                    {monthsToGoal > 0 && !goal.target_date && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {language === "en" ? "Months to goal" : "Meses para la meta"}
                        </p>
                        <p className="text-sm font-semibold text-success">
                          {monthsToGoal}{" "}
                          {monthsToGoal === 1
                            ? language === "en"
                              ? "month"
                              : "mes"
                            : language === "en"
                              ? "months"
                              : "meses"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Suggested monthly contribution */}
                  {goal.target_date && suggestedMonthly > 0 && !goal.is_active && (
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">
                            {language === "en" ? "Suggested monthly" : "Sugerencia mensual"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "en" ? "To reach your goal on time" : "Para alcanzar tu meta a tiempo"}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-primary">£{suggestedMonthly.toFixed(2)}</span>
                      </div>
                      <Button
                        onClick={() => activateGoalContribution(goal.id, suggestedMonthly)}
                        className="w-full"
                        disabled={suggestedMonthly > availableBudget}
                      >
                        {suggestedMonthly > availableBudget
                          ? language === "en"
                            ? "Insufficient budget"
                            : "Presupuesto insuficiente"
                          : language === "en"
                            ? "Accept & Activate"
                            : "Aceptar y Activar"}
                      </Button>
                    </div>
                  )}

                  {/* Active contribution display */}
                  {goal.is_active && goal.monthly_contribution && (
                    <div className="pt-3 border-t bg-success/5 -mx-4 -mb-3 px-4 pb-3 rounded-b-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-success">
                          {language === "en" ? "Monthly contribution" : "Aporte mensual"}
                        </span>
                        <span className="text-lg font-bold text-success">£{goal.monthly_contribution.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
