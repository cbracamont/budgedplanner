import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Plus, Trash2 } from "lucide-react";
import { getTranslation, Language } from "@/lib/i18n";

interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  payment_day: number;
}

interface IncomeManagerProps {
  language: Language;
  onIncomeChange: (total: number) => void;
}

export const IncomeManager = ({ language, onIncomeChange }: IncomeManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [newIncome, setNewIncome] = useState({ name: "", amount: "", payment_day: "1" });

  useEffect(() => {
    loadIncomeSources();
  }, []);

  useEffect(() => {
    const total = incomeSources.reduce((sum, source) => sum + source.amount, 0);
    onIncomeChange(total);
  }, [incomeSources, onIncomeChange]);

  const loadIncomeSources = async () => {
    const { data, error } = await supabase
      .from("income_sources")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setIncomeSources(data || []);
    }
  };

  const addIncomeSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("income_sources").insert({
      user_id: user.id,
      name: newIncome.name,
      amount: parseFloat(newIncome.amount),
      payment_day: parseInt(newIncome.payment_day),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewIncome({ name: "", amount: "", payment_day: "1" });
      loadIncomeSources();
      toast({ title: "Success", description: "Income source added" });
    }
  };

  const deleteIncomeSource = async (id: string) => {
    const { error } = await supabase.from("income_sources").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      loadIncomeSources();
      toast({ title: "Success", description: "Income source deleted" });
    }
  };

  return (
    <Card className="shadow-medium border-income/20">
      <CardHeader className="bg-income/10 border-b border-income/20">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-income" />
          <CardTitle>{t('income')}</CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Manage your income sources' : 'Administra tus fuentes de ingreso'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <form onSubmit={addIncomeSource} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="income-name">
                {language === 'en' ? 'Name' : 'Nombre'}
              </Label>
              <Input
                id="income-name"
                placeholder={language === 'en' ? 'Salary, Tips, etc.' : 'Salario, Propinas, etc.'}
                value={newIncome.name}
                onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-amount">
                {language === 'en' ? 'Amount' : 'Monto'}
              </Label>
              <Input
                id="income-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newIncome.amount}
                onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-day">
                {language === 'en' ? 'Payment Day' : 'Día de Pago'}
              </Label>
              <Input
                id="income-day"
                type="number"
                min="1"
                max="31"
                value={newIncome.payment_day}
                onChange={(e) => setNewIncome({ ...newIncome, payment_day: e.target.value })}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {language === 'en' ? 'Add Income Source' : 'Agregar Ingreso'}
          </Button>
        </form>

        <div className="space-y-3">
          {incomeSources.map((source) => (
            <div key={source.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{source.name}</p>
                <p className="text-sm text-muted-foreground">
                  £{source.amount.toFixed(2)} - {language === 'en' ? 'Day' : 'Día'} {source.payment_day}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteIncomeSource(source.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
