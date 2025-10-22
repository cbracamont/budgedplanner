import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTranslation, Language, ukBanks } from "@/lib/i18n";

interface Debt {
  id: string;
  name: string;
  bank: string | null;
  balance: number;
  apr: number;
  minimum_payment: number;
  payment_day: number;
  is_installment?: boolean;
  total_amount?: number;
  number_of_installments?: number;
  installment_amount?: number;
  start_date?: string;
  end_date?: string;
}

interface DebtsManagerProps {
  language: Language;
  onDebtsChange: (total: number) => void;
}

export const DebtsManager = ({ language, onDebtsChange }: DebtsManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [newDebt, setNewDebt] = useState({
    name: "",
    bank: "",
    balance: "",
    apr: "",
    minimum_payment: "",
    payment_day: "1",
    is_installment: false,
    total_amount: "",
    number_of_installments: "",
    installment_amount: "",
    start_date: "",
    end_date: ""
  });
  const [isInstallment, setIsInstallment] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadDebts();
  }, []);

  useEffect(() => {
    const total = debts.reduce((sum, debt) => sum + debt.minimum_payment, 0);
    onDebtsChange(total);
  }, [debts, onDebtsChange]);

  const loadDebts = async () => {
    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setDebts(data || []);
    }
  };

  const addDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const debtData: any = {
      user_id: user.id,
      name: newDebt.name,
      bank: newDebt.bank || null,
      balance: parseFloat(parseFloat(newDebt.balance).toFixed(2)),
      apr: parseFloat(parseFloat(newDebt.apr).toFixed(2)),
      minimum_payment: parseFloat(parseFloat(newDebt.minimum_payment).toFixed(2)),
      payment_day: parseInt(newDebt.payment_day),
      is_installment: isInstallment
    };

    if (isInstallment) {
      debtData.total_amount = parseFloat(parseFloat(newDebt.total_amount).toFixed(2));
      debtData.number_of_installments = parseInt(newDebt.number_of_installments);
      debtData.installment_amount = parseFloat(parseFloat(newDebt.installment_amount).toFixed(2));
      debtData.start_date = newDebt.start_date;
      debtData.end_date = newDebt.end_date;
    }

    const { error } = await supabase.from("debts").insert(debtData);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewDebt({ 
        name: "", bank: "", balance: "", apr: "", minimum_payment: "", payment_day: "1",
        is_installment: false, total_amount: "", number_of_installments: "", 
        installment_amount: "", start_date: "", end_date: ""
      });
      setIsInstallment(false);
      loadDebts();
      toast({ title: "Success", description: "Debt added" });
    }
  };

  const deleteDebt = async (id: string) => {
    const { error } = await supabase.from("debts").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      loadDebts();
      toast({ title: "Success", description: "Debt deleted" });
    }
  };

  const updateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;

    const { error } = await supabase
      .from("debts")
      .update({
        name: editingDebt.name,
        bank: editingDebt.bank,
        balance: editingDebt.balance,
        apr: editingDebt.apr,
        minimum_payment: editingDebt.minimum_payment,
        payment_day: editingDebt.payment_day,
      })
      .eq("id", editingDebt.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setIsEditDialogOpen(false);
      setEditingDebt(null);
      loadDebts();
      toast({ title: "Success", description: "Debt updated" });
    }
  };

  return (
    <Card className="shadow-medium border-debt/20">
      <CardHeader className="bg-debt/10 border-b border-debt/20">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-debt" />
          <CardTitle>{t('debts')}</CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Manage your debts and payment dates' : 'Administra tus deudas y fechas de pago'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <form onSubmit={addDebt} className="space-y-4 p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <input 
              type="checkbox" 
              id="is-installment" 
              checked={isInstallment}
              onChange={(e) => setIsInstallment(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="is-installment">
              {language === 'en' ? 'Installment Payment' : 'Pago en Cuotas'}
            </Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="debt-name">
                {language === 'en' ? 'Name' : 'Nombre'}
              </Label>
              <Input
                id="debt-name"
                placeholder={language === 'en' ? 'Credit Card, Loan, etc.' : 'Tarjeta, Préstamo, etc.'}
                value={newDebt.name}
                onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-bank">{t('bank')}</Label>
              <Select value={newDebt.bank} onValueChange={(value) => setNewDebt({ ...newDebt, bank: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectBank')} />
                </SelectTrigger>
                <SelectContent>
                  {ukBanks.map(bank => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-balance">
                {language === 'en' ? 'Total Balance' : 'Balance Total'}
              </Label>
              <Input
                id="debt-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newDebt.balance}
                onChange={(e) => setNewDebt({ ...newDebt, balance: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-apr">{t('interestRate')}</Label>
              <Input
                id="debt-apr"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newDebt.apr}
                onChange={(e) => setNewDebt({ ...newDebt, apr: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-payment">{t('minimumPayment')}</Label>
              <Input
                id="debt-payment"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newDebt.minimum_payment}
                onChange={(e) => setNewDebt({ ...newDebt, minimum_payment: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-day">
                {language === 'en' ? 'Payment Day' : 'Día de Pago'}
              </Label>
              <Input
                id="debt-day"
                type="number"
                min="1"
                max="31"
                value={newDebt.payment_day}
                onChange={(e) => setNewDebt({ ...newDebt, payment_day: e.target.value })}
                required
              />
            </div>
            {isInstallment && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="total-amount">{language === 'en' ? 'Total Amount' : 'Monto Total'}</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newDebt.total_amount}
                    onChange={(e) => setNewDebt({ ...newDebt, total_amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num-installments">{language === 'en' ? 'Number of Installments' : 'Número de Cuotas'}</Label>
                  <Input
                    id="num-installments"
                    type="number"
                    min="1"
                    value={newDebt.number_of_installments}
                    onChange={(e) => {
                      const numInstallments = parseInt(e.target.value);
                      const totalAmt = parseFloat(newDebt.total_amount);
                      const startDate = newDebt.start_date;
                      let endDate = "";
                      
                      if (startDate && numInstallments > 0) {
                        const start = new Date(startDate);
                        start.setMonth(start.getMonth() + numInstallments);
                        endDate = start.toISOString().split('T')[0];
                      }
                      
                      setNewDebt({ 
                        ...newDebt, 
                        number_of_installments: e.target.value,
                        installment_amount: (!isNaN(totalAmt) && numInstallments > 0) 
                          ? (totalAmt / numInstallments).toFixed(2) 
                          : "",
                        end_date: endDate
                      });
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="installment-amount">{language === 'en' ? 'Amount per Installment' : 'Monto por Cuota'}</Label>
                  <Input
                    id="installment-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newDebt.installment_amount}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date">{language === 'en' ? 'Start Date' : 'Fecha de Inicio'}</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={newDebt.start_date}
                    onChange={(e) => {
                      const startDate = e.target.value;
                      const numInstallments = parseInt(newDebt.number_of_installments);
                      let endDate = "";
                      
                      if (startDate && numInstallments > 0) {
                        const start = new Date(startDate);
                        start.setMonth(start.getMonth() + numInstallments);
                        endDate = start.toISOString().split('T')[0];
                      }
                      
                      setNewDebt({ ...newDebt, start_date: startDate, end_date: endDate });
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">{language === 'en' ? 'End Date' : 'Fecha de Finalización'}</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={newDebt.end_date}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </>
            )}
          </div>
          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {language === 'en' ? 'Add Debt' : 'Agregar Deuda'}
          </Button>
        </form>

        <div className="space-y-3">
          {debts.map((debt) => (
            <div key={debt.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{debt.name}</p>
                {debt.is_installment ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {debt.bank && `${debt.bank} • `}
                      £{debt.installment_amount?.toFixed(2)}/installment • {language === 'en' ? 'Day' : 'Día'} {debt.payment_day}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'en' ? 'Total:' : 'Total:'} £{debt.total_amount?.toFixed(2)} • 
                      {debt.number_of_installments} {language === 'en' ? 'installments' : 'cuotas'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {debt.bank && `${debt.bank} • `}
                      £{debt.minimum_payment.toFixed(2)}/month • {language === 'en' ? 'Day' : 'Día'} {debt.payment_day}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'en' ? 'Balance:' : 'Balance:'} £{debt.balance.toFixed(2)} • APR: {debt.apr}%
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-1">
                <Dialog open={isEditDialogOpen && editingDebt?.id === debt.id} onOpenChange={(open) => {
                  setIsEditDialogOpen(open);
                  if (!open) setEditingDebt(null);
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingDebt(debt);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{language === 'en' ? 'Edit Debt' : 'Editar Deuda'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={updateDebt} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-debt-name">{language === 'en' ? 'Name' : 'Nombre'}</Label>
                        <Input
                          id="edit-debt-name"
                          value={editingDebt?.name || ''}
                          onChange={(e) => setEditingDebt(editingDebt ? {...editingDebt, name: e.target.value} : null)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-debt-bank">{t('bank')}</Label>
                        <Select value={editingDebt?.bank || ''} onValueChange={(value) => setEditingDebt(editingDebt ? {...editingDebt, bank: value} : null)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectBank')} />
                          </SelectTrigger>
                          <SelectContent>
                            {ukBanks.map(bank => (
                              <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-debt-balance">{language === 'en' ? 'Total Balance' : 'Balance Total'}</Label>
                        <Input
                          id="edit-debt-balance"
                          type="number"
                          step="0.01"
                          value={editingDebt?.balance || ''}
                          onChange={(e) => setEditingDebt(editingDebt ? {...editingDebt, balance: parseFloat(e.target.value)} : null)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-debt-apr">{t('interestRate')}</Label>
                        <Input
                          id="edit-debt-apr"
                          type="number"
                          step="0.01"
                          value={editingDebt?.apr || ''}
                          onChange={(e) => setEditingDebt(editingDebt ? {...editingDebt, apr: parseFloat(e.target.value)} : null)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-debt-payment">{t('minimumPayment')}</Label>
                        <Input
                          id="edit-debt-payment"
                          type="number"
                          step="0.01"
                          value={editingDebt?.minimum_payment || ''}
                          onChange={(e) => setEditingDebt(editingDebt ? {...editingDebt, minimum_payment: parseFloat(e.target.value)} : null)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-debt-day">{language === 'en' ? 'Payment Day' : 'Día de Pago'}</Label>
                        <Input
                          id="edit-debt-day"
                          type="number"
                          min="1"
                          max="31"
                          value={editingDebt?.payment_day || ''}
                          onChange={(e) => setEditingDebt(editingDebt ? {...editingDebt, payment_day: parseInt(e.target.value)} : null)}
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
                  onClick={() => deleteDebt(debt.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
