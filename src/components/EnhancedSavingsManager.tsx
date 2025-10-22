import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PiggyBank, TrendingUp, History, Pencil, Trash2, Shield } from "lucide-react";
import { formatCurrency, getTranslation, Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface SavingsManagerProps {
  language: Language;
  availableToSave: number;
  totalExpenses: number;
}

interface SavingsHistoryEntry {
  id: string;
  month_year: string;
  amount: number;
  notes?: string;
}

export const EnhancedSavingsManager = ({ language, availableToSave, totalExpenses }: SavingsManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [totalAccumulated, setTotalAccumulated] = useState(0);
  const [savingsId, setSavingsId] = useState<string | null>(null);
  const [savingsHistory, setSavingsHistory] = useState<SavingsHistoryEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<SavingsHistoryEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [emergencyFund, setEmergencyFund] = useState("");
  const [emergencyFundMonths, setEmergencyFundMonths] = useState<number>(4);
  const [monthlyEmergencyContribution, setMonthlyEmergencyContribution] = useState("");

  const currentMonth = new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  };

  const emergencyFundTarget = totalExpenses * emergencyFundMonths;
  const emergencyFundProgress = emergencyFundTarget > 0 
    ? (parseFloat(emergencyFund || "0") / emergencyFundTarget) * 100 
    : 0;
  const remainingForEmergencyFund = Math.max(0, emergencyFundTarget - parseFloat(emergencyFund || "0"));

  useEffect(() => {
    loadSavings();
    loadSavingsHistory();
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
      setEmergencyFund(data.emergency_fund?.toString() || "");
      setMonthlyEmergencyContribution(data.monthly_emergency_contribution?.toString() || "");
    }
  };

  const loadSavingsHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('savings_history')
      .select('*')
      .eq('user_id', user.id)
      .order('month_year', { ascending: false });

    if (!error && data) {
      setSavingsHistory(data);
    }
  };

  const updateSavings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const goalValue = parseFloat(monthlyGoal) || 0;
    const emergencyValue = parseFloat(emergencyFund) || 0;

    if (savingsId) {
      const { error } = await supabase
        .from('savings')
        .update({ 
          monthly_goal: goalValue,
          goal_name: goalName,
          goal_description: goalDescription,
          emergency_fund: emergencyValue,
          monthly_emergency_contribution: parseFloat(monthlyEmergencyContribution) || 0
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
          goal_description: goalDescription,
          emergency_fund: emergencyValue,
          monthly_emergency_contribution: parseFloat(monthlyEmergencyContribution) || 0
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

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const { data: existing } = await supabase
      .from('savings_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .maybeSingle();

    if (existing) {
      toast({ 
        title: "Info", 
        description: language === 'en' ? 'Savings for this month already recorded' : 'Ahorros de este mes ya registrados',
        variant: "default"
      });
      return;
    }

    const { error } = await supabase
      .from('savings_history')
      .insert({
        user_id: user.id,
        month_year: monthYear,
        amount: availableToSave,
        notes: `${currentMonth}`
      });

    if (error) {
      toast({ title: "Error", description: "Failed to save monthly record", variant: "destructive" });
      return;
    }

    const newTotal = totalAccumulated + availableToSave;
    await supabase
      .from('savings')
      .update({ total_accumulated: newTotal })
      .eq('id', savingsId);

    setTotalAccumulated(newTotal);
    loadSavingsHistory();
    toast({ title: "Success", description: "Monthly savings saved to history" });
  };

  const updateHistoryEntry = async () => {
    if (!editingEntry) return;

    const { error } = await supabase
      .from('savings_history')
      .update({ amount: editingEntry.amount, notes: editingEntry.notes })
      .eq('id', editingEntry.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update entry", variant: "destructive" });
      return;
    }

    const { data } = await supabase
      .from('savings_history')
      .select('amount')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    const newTotal = data?.reduce((sum, entry) => sum + parseFloat(entry.amount.toString()), 0) || 0;
    
    await supabase
      .from('savings')
      .update({ total_accumulated: newTotal })
      .eq('id', savingsId);

    setTotalAccumulated(newTotal);
    setIsEditDialogOpen(false);
    setEditingEntry(null);
    loadSavingsHistory();
    toast({ title: "Success", description: "Entry updated successfully" });
  };

  const deleteHistoryEntry = async (id: string, amount: number) => {
    const { error } = await supabase
      .from('savings_history')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
      return;
    }

    const newTotal = totalAccumulated - amount;
    await supabase
      .from('savings')
      .update({ total_accumulated: newTotal })
      .eq('id', savingsId);

    setTotalAccumulated(newTotal);
    loadSavingsHistory();
    toast({ title: "Success", description: "Entry deleted successfully" });
  };

  const formatMonthYear = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = monthNames[language][date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  return (
    <>
      {/* Emergency Fund Section */}
      <Card className="shadow-medium mb-6">
        <CardHeader className="bg-gradient-to-r from-warning/20 to-warning/10 border-l-4 border-warning rounded-t-xl">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-warning" />
            <CardTitle className="text-xl">
              {language === 'en' ? 'Emergency Fund' : 'Fondo de Emergencia'}
            </CardTitle>
          </div>
          <CardDescription>
            {language === 'en' 
              ? 'Build a safety net for unexpected expenses' 
              : 'Construye una red de seguridad para gastos inesperados'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Emergency Fund Target Selection */}
          <div>
            <Label>
              {language === 'en' 
                ? 'Emergency Fund Target (Months of Expenses)' 
                : 'Objetivo del Fondo (Meses de Gastos)'}
            </Label>
            <Select value={emergencyFundMonths.toString()} onValueChange={(v) => setEmergencyFundMonths(parseInt(v))}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 {language === 'en' ? 'months' : 'meses'}</SelectItem>
                <SelectItem value="4">4 {language === 'en' ? 'months' : 'meses'}</SelectItem>
                <SelectItem value="5">5 {language === 'en' ? 'months' : 'meses'}</SelectItem>
                <SelectItem value="6">6 {language === 'en' ? 'months' : 'meses'}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              {language === 'en'
                ? `Target: ${formatCurrency(emergencyFundTarget)} (${emergencyFundMonths} months of expenses)`
                : `Objetivo: ${formatCurrency(emergencyFundTarget)} (${emergencyFundMonths} meses de gastos)`}
            </p>
          </div>

          {/* Current Emergency Fund */}
          <div>
            <Label htmlFor="emergencyFund">
              {language === 'en' ? 'Current Emergency Fund' : 'Fondo de Emergencia Actual'}
            </Label>
            <Input
              id="emergencyFund"
              type="number"
              step="0.01"
              value={emergencyFund}
              onChange={(e) => setEmergencyFund(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Monthly Contribution */}
          <div>
            <Label htmlFor="monthlyEmergencyContribution">
              {language === 'en' 
                ? 'Monthly Contribution to Emergency Fund' 
                : 'Aporte Mensual al Fondo de Emergencia'}
            </Label>
            <Input
              id="monthlyEmergencyContribution"
              type="number"
              step="0.01"
              value={monthlyEmergencyContribution}
              onChange={(e) => setMonthlyEmergencyContribution(e.target.value)}
              className="mt-2"
              placeholder={language === 'en' ? 'Amount to save monthly' : 'Monto a ahorrar mensualmente'}
            />
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {language === 'en' ? 'Progress' : 'Progreso'}
              </span>
              <span className="font-semibold">
                {formatCurrency(parseFloat(emergencyFund || "0"))} / {formatCurrency(emergencyFundTarget)}
              </span>
            </div>
            <Progress value={emergencyFundProgress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {language === 'en'
                ? `${emergencyFundProgress.toFixed(1)}% complete - ${formatCurrency(remainingForEmergencyFund)} remaining`
                : `${emergencyFundProgress.toFixed(1)}% completo - ${formatCurrency(remainingForEmergencyFund)} restante`}
            </p>
          </div>

          <Button onClick={updateSavings} className="w-full">
            {language === 'en' ? 'Save Emergency Fund Settings' : 'Guardar Configuración del Fondo'}
          </Button>
        </CardContent>
      </Card>

      {/* General Savings Section */}
      <Card className="shadow-medium border-muted">
        <CardHeader className="bg-gradient-income text-income-foreground">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            <CardTitle>{language === 'en' ? 'Savings' : 'Ahorros'}</CardTitle>
          </div>
          <CardDescription className="text-income-foreground/80">
            {language === 'en' ? 'Manage your savings goals and history' : 'Gestiona tus metas e historial de ahorro'}
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

          {/* Savings History */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{language === 'en' ? 'Savings History' : 'Historial de Ahorros'}</h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savingsHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{formatMonthYear(entry.month_year)}</p>
                    <p className="text-sm text-muted-foreground">£{parseFloat(entry.amount.toString()).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Dialog open={isEditDialogOpen && editingEntry?.id === entry.id} onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (!open) setEditingEntry(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingEntry(entry);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{language === 'en' ? 'Edit Savings Entry' : 'Editar Entrada de Ahorros'}</DialogTitle>
                        </DialogHeader>
                        {editingEntry && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>{language === 'en' ? 'Amount' : 'Monto'}</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editingEntry.amount}
                                onChange={(e) => setEditingEntry({...editingEntry, amount: parseFloat(e.target.value)})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{language === 'en' ? 'Notes' : 'Notas'}</Label>
                              <Input
                                value={editingEntry.notes || ''}
                                onChange={(e) => setEditingEntry({...editingEntry, notes: e.target.value})}
                              />
                            </div>
                            <Button onClick={updateHistoryEntry} className="w-full">
                              {language === 'en' ? 'Update' : 'Actualizar'}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteHistoryEntry(entry.id, parseFloat(entry.amount.toString()))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};