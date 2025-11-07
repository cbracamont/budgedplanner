import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, Trash2, Pencil, TrendingDown, TrendingUp as TrendingUpIcon, CheckCircle2, PiggyBank } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  useSavingsGoals,
  useAddSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
} from "@/hooks/useFinancialData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInMonths, isPast } from "date-fns";
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
  priority?: "low" | "medium" | "high";
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
          if (onBudgetAllocation) onBudgetAllocation(0);
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
        if (onBudgetAllocation) onBudgetAllocation(0);
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
              const suggestedMonthly = goal.target_date && monthsToGoal ? (goal.target_amount - goal.current_amount) / monthsToGoal : 0;
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
                          <status.icon className="h-5 w-5" />
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
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${progress}, 100`}
                            className="transition-all duration-1000 text-primary"
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
                          {goal.target_date && monthsToGoal && (
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
