import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Shield } from "lucide-react";
import { formatCurrency, getTranslation, Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface EmergencyFundManagerProps {
  language: Language;
  totalExpenses: number;
}

export const EmergencyFundManager = ({ language, totalExpenses }: EmergencyFundManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [savingsId, setSavingsId] = useState<string | null>(null);
  const [emergencyFund, setEmergencyFund] = useState("");
  const [emergencyFundMonths, setEmergencyFundMonths] = useState<number>(4);
  const [monthlyEmergencyContribution, setMonthlyEmergencyContribution] = useState("");

  const emergencyFundTarget = totalExpenses * emergencyFundMonths;
  const emergencyFundProgress = emergencyFundTarget > 0 
    ? Math.min(100, (parseFloat(emergencyFund || "0") / emergencyFundTarget) * 100) 
    : 0;
  const remainingForEmergencyFund = Math.max(0, emergencyFundTarget - parseFloat(emergencyFund || "0"));

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
      setEmergencyFund(data.emergency_fund?.toString() || "");
      setMonthlyEmergencyContribution(data.monthly_emergency_contribution?.toString() || "");
    }
  };

  const updateSavings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const emergencyValue = parseFloat(emergencyFund) || 0;

    if (savingsId) {
      const { error } = await supabase
        .from('savings')
        .update({ 
          emergency_fund: emergencyValue,
          monthly_emergency_contribution: parseFloat(monthlyEmergencyContribution) || 0
        })
        .eq('id', savingsId);

      if (error) {
        toast({ title: "Error", description: "Failed to update emergency fund", variant: "destructive" });
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('savings')
        .insert({ 
          user_id: user.id, 
          emergency_fund: emergencyValue,
          monthly_emergency_contribution: parseFloat(monthlyEmergencyContribution) || 0
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: "Failed to create emergency fund", variant: "destructive" });
        return;
      }

      setSavingsId(data.id);
    }

    toast({ title: "Success", description: "Emergency fund updated successfully" });
    queryClient.invalidateQueries({ queryKey: ["savings"] });
  };

  return (
    <Card className="shadow-medium">
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
  );
};