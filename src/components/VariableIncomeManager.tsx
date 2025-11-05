import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Trash2, Pencil } from "lucide-react";
import { getTranslation, Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VariableIncome {
  id: string;
  name: string;
  amount: number;
  payment_day: number;
  frequency: string;
}

interface VariableIncomeManagerProps {
  onIncomeChange?: (total: number) => void;
  language: Language;
}

export const VariableIncomeManager = ({ onIncomeChange, language }: VariableIncomeManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDay, setPaymentDay] = useState("1");
  const [frequency, setFrequency] = useState("monthly");
  const [editingIncome, setEditingIncome] = useState<VariableIncome | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: incomes = [] } = useQuery({
    queryKey: ['variable-income'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('income_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('income_type', 'variable')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as VariableIncome[];
    }
  });

  const addIncomeMutation = useMutation({
    mutationFn: async (income: { name: string; amount: number; payment_day: number; frequency: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('income_sources')
        .insert({
          user_id: user.id,
          name: income.name,
          amount: income.amount,
          payment_day: income.payment_day,
          frequency: income.frequency,
          income_type: 'variable'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable-income'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast({ title: language === 'en' ? 'Income added' : 'Ingreso añadido' });
    }
  });

  const updateIncomeMutation = useMutation({
    mutationFn: async (income: VariableIncome) => {
      const { error } = await supabase
        .from('income_sources')
        .update({
          name: income.name,
          amount: income.amount,
          payment_day: income.payment_day,
          frequency: income.frequency
        })
        .eq('id', income.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable-income'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast({ title: language === 'en' ? 'Income updated' : 'Ingreso actualizado' });
    }
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('income_sources')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable-income'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast({ title: language === 'en' ? 'Income deleted' : 'Ingreso eliminado' });
    }
  });

  useEffect(() => {
    const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    onIncomeChange?.(total);
  }, [incomes, onIncomeChange]);

  const addIncome = async () => {
    if (!name.trim() || !amount) return;

    addIncomeMutation.mutate({
      name: name.trim(),
      amount: parseFloat(parseFloat(amount).toFixed(2)),
      payment_day: parseInt(paymentDay),
      frequency
    }, {
      onSuccess: () => {
        setName("");
        setAmount("");
        setPaymentDay("1");
        setFrequency("monthly");
      }
    });
  };

  const deleteIncome = async (incomeId: string) => {
    deleteIncomeMutation.mutate(incomeId);
  };

  const updateIncome = async () => {
    if (!editingIncome) return;

    updateIncomeMutation.mutate(editingIncome, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingIncome(null);
      }
    });
  };

  const getFrequencyLabel = (freq: string) => {
    const labels = {
      weekly: language === 'en' ? 'Weekly' : 'Semanal',
      monthly: language === 'en' ? 'Monthly' : 'Mensual',
      quarterly: language === 'en' ? 'Quarterly' : 'Trimestral',
      'semi-annually': language === 'en' ? 'Semi-annually' : 'Semestral',
      annually: language === 'en' ? 'Annually' : 'Anual'
    };
    return labels[freq as keyof typeof labels] || freq;
  };

  return (
    <Card className="shadow-medium border-warning/20">
      <CardHeader className="bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <CardTitle>{language === 'en' ? 'Variable Income' : 'Ingresos Variables'}</CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Manage recurring variable income like bonuses, freelance work, etc.' : 'Gestiona ingresos variables recurrentes como bonos, trabajos freelance, etc.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Add Income */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            {language === 'en' ? 'Add Income' : 'Añadir Ingreso'}
          </Label>
          <div className="grid gap-3">
            <div>
              <Label>{language === 'en' ? 'Name' : 'Nombre'}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'en' ? 'Income name' : 'Nombre del ingreso'}
              />
            </div>
            <div>
              <Label>{language === 'en' ? 'Amount' : 'Monto'}</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>{language === 'en' ? 'Payment Day' : 'Día de Pago'}</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={paymentDay}
                onChange={(e) => setPaymentDay(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <Label>{language === 'en' ? 'Frequency' : 'Frecuencia'}</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{language === 'en' ? 'Weekly' : 'Semanal'}</SelectItem>
                  <SelectItem value="monthly">{language === 'en' ? 'Monthly' : 'Mensual'}</SelectItem>
                  <SelectItem value="quarterly">{language === 'en' ? 'Quarterly' : 'Trimestral'}</SelectItem>
                  <SelectItem value="semi-annually">{language === 'en' ? 'Semi-annually' : 'Semestral'}</SelectItem>
                  <SelectItem value="annually">{language === 'en' ? 'Annually' : 'Anual'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addIncome}>
              {language === 'en' ? 'Add Income' : 'Añadir Ingreso'}
            </Button>
          </div>
        </div>

        {/* Income List */}
        {incomes.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">
              {language === 'en' ? 'Current Variable Incomes' : 'Ingresos Variables Actuales'}
            </Label>
            <div className="grid gap-2">
              {incomes.map(income => (
                <div key={income.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <div>
                    <p className="font-medium">{income.name}</p>
                    <p className="text-lg font-bold text-primary">£{income.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getFrequencyLabel(income.frequency)} - {language === 'en' ? 'Day' : 'Día'} {income.payment_day}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingIncome(income);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteIncome(income.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Income Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'en' ? 'Edit Income' : 'Editar Ingreso'}</DialogTitle>
            </DialogHeader>
            {editingIncome && (
              <div className="space-y-4">
                <div>
                  <Label>{language === 'en' ? 'Name' : 'Nombre'}</Label>
                  <Input
                    value={editingIncome.name}
                    onChange={(e) => setEditingIncome({ ...editingIncome, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Amount' : 'Monto'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingIncome.amount}
                    onChange={(e) => setEditingIncome({ ...editingIncome, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Payment Day' : 'Día de Pago'}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={editingIncome.payment_day}
                    onChange={(e) => setEditingIncome({ ...editingIncome, payment_day: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Frequency' : 'Frecuencia'}</Label>
                  <Select 
                    value={editingIncome.frequency} 
                    onValueChange={(value) => setEditingIncome({ ...editingIncome, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">{language === 'en' ? 'Weekly' : 'Semanal'}</SelectItem>
                      <SelectItem value="monthly">{language === 'en' ? 'Monthly' : 'Mensual'}</SelectItem>
                      <SelectItem value="quarterly">{language === 'en' ? 'Quarterly' : 'Trimestral'}</SelectItem>
                      <SelectItem value="semi-annually">{language === 'en' ? 'Semi-annually' : 'Semestral'}</SelectItem>
                      <SelectItem value="annually">{language === 'en' ? 'Annually' : 'Anual'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </Button>
              <Button onClick={updateIncome}>
                {language === 'en' ? 'Save Changes' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};