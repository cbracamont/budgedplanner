import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, Plus, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SectionCard, SectionEmpty, SectionLoading } from "@/components/ui/section-card";
import { getTranslation, Language } from "@/lib/i18n";
import { useIncomeSources, useAddIncome, useUpdateIncome, useDeleteIncome } from "@/hooks/useFinancialData";


interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  payment_day: number;
}

interface IncomeManagerProps {
  language: Language;
  onIncomeChange?: (total: number) => void;
}

export const IncomeManager = ({ language, onIncomeChange }: IncomeManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { data: incomeSources = [], isLoading } = useIncomeSources();
  const addIncomeMutation = useAddIncome();
  const updateIncomeMutation = useUpdateIncome();
  const deleteIncomeMutation = useDeleteIncome();
  
  const [newIncome, setNewIncome] = useState({ name: "", amount: "", payment_day: "1" });
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const total = incomeSources.reduce((sum, source) => sum + source.amount, 0);
    onIncomeChange?.(total);
  }, [incomeSources, onIncomeChange]);

  const addIncomeSource = async (e: React.FormEvent) => {
    e.preventDefault();
    await addIncomeMutation.mutateAsync({
      name: newIncome.name,
      amount: parseFloat(newIncome.amount),
      payment_day: parseInt(newIncome.payment_day),
    });
    setNewIncome({ name: "", amount: "", payment_day: "1" });
  };

  const deleteIncomeSource = async (id: string) => {
    await deleteIncomeMutation.mutateAsync(id);
  };

  const updateIncomeSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncome) return;

    await updateIncomeMutation.mutateAsync({
      id: editingIncome.id,
      name: editingIncome.name,
      amount: editingIncome.amount,
      payment_day: editingIncome.payment_day,
    });
    
    setIsEditDialogOpen(false);
    setEditingIncome(null);
  };

  return (
    <SectionCard
      accent="income"
      icon={TrendingUp}
      title={t('income')}
      description={language === 'en' ? 'Manage your income sources' : language === 'pt' ? 'Gerencie as suas fontes de renda' : 'Administra tus fuentes de ingreso'}
    >
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

        {isLoading ? (
          <SectionLoading />
        ) : incomeSources.length === 0 ? (
          <SectionEmpty
            icon={TrendingUp}
            title={t('emptyIncomeTitle')}
            description={t('emptyIncomeDesc')}
          />
        ) : (
        <div className="space-y-3">
          {incomeSources.map((source) => (
            <div key={source.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{source.name}</p>
                <p className="text-sm text-muted-foreground">
                  £{source.amount.toFixed(2)} - {language === 'en' ? 'Day' : 'Día'} {source.payment_day}
                </p>
              </div>
              <div className="flex gap-1">
                <Dialog open={isEditDialogOpen && editingIncome?.id === source.id} onOpenChange={(open) => {
                  setIsEditDialogOpen(open);
                  if (!open) setEditingIncome(null);
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingIncome(source);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{language === 'en' ? 'Edit Income Source' : 'Editar Ingreso'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={updateIncomeSource} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-income-name">{language === 'en' ? 'Name' : 'Nombre'}</Label>
                        <Input
                          id="edit-income-name"
                          value={editingIncome?.name || ''}
                          onChange={(e) => setEditingIncome(editingIncome ? {...editingIncome, name: e.target.value} : null)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-income-amount">{language === 'en' ? 'Amount' : 'Monto'}</Label>
                        <Input
                          id="edit-income-amount"
                          type="number"
                          step="0.01"
                          value={editingIncome?.amount || ''}
                          onChange={(e) => setEditingIncome(editingIncome ? {...editingIncome, amount: parseFloat(e.target.value)} : null)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-income-day">{language === 'en' ? 'Payment Day' : 'Día de Pago'}</Label>
                        <Input
                          id="edit-income-day"
                          type="number"
                          min="1"
                          max="31"
                          value={editingIncome?.payment_day || ''}
                          onChange={(e) => setEditingIncome(editingIncome ? {...editingIncome, payment_day: parseInt(e.target.value)} : null)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        {language === 'en' ? 'Update' : 'Actualizar'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteIncomeSource(source.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        )}
    </SectionCard>
  );
};
