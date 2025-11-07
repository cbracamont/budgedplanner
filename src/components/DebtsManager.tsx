import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getTranslation, Language, ukBanks } from "@/lib/i18n";
import { useDebts, useAddDebt, useUpdateDebt, useDeleteDebt } from "@/hooks/useFinancialData";
import { useDebtPayments } from "@/hooks/useDebtPayments";
import { format } from "date-fns";

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
  promotional_apr?: number;
  promotional_apr_end_date?: string;
  regular_apr?: number;
}

interface DebtsManagerProps {
  language: Language;
  onDebtsChange?: (total: number) => void;
}

export const DebtsManager = ({ language, onDebtsChange }: DebtsManagerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const { data: allDebts = [] } = useDebts();
  
  // Filter out paid debts (balance = 0)
  const debts = allDebts.filter(debt => debt.balance > 0);
  const paidDebts = allDebts.filter(debt => debt.balance === 0);
  
  const addDebtMutation = useAddDebt();
  const updateDebtMutation = useUpdateDebt();
  const deleteDebtMutation = useDeleteDebt();
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
    end_date: "",
    promotional_apr: "",
    promotional_apr_end_date: "",
    regular_apr: ""
  });
  const [isInstallment, setIsInstallment] = useState(false);
  const [hasPromotionalAPR, setHasPromotionalAPR] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingDebtHistory, setViewingDebtHistory] = useState<Debt | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  const { data: debtPayments = [] } = useDebtPayments(viewingDebtHistory?.id);

  useEffect(() => {
    const total = debts.reduce((sum, debt) => sum + debt.minimum_payment, 0);
    onDebtsChange?.(total);
  }, [debts, onDebtsChange]);

  const addDebt = async (e: React.FormEvent) => {
    e.preventDefault();

    const debtData: any = {
      name: newDebt.name,
      bank: newDebt.bank || null,
      balance: parseFloat(parseFloat(newDebt.balance).toFixed(2)),
      payment_day: parseInt(newDebt.payment_day),
      is_installment: isInstallment
    };

    if (isInstallment) {
      debtData.total_amount = debtData.balance;
      debtData.number_of_installments = parseInt(newDebt.number_of_installments);
      debtData.installment_amount = parseFloat(parseFloat(newDebt.installment_amount).toFixed(2));
      debtData.start_date = newDebt.start_date;
      debtData.end_date = newDebt.end_date;
      debtData.apr = 0;
      debtData.minimum_payment = debtData.installment_amount;
    } else {
      debtData.minimum_payment = parseFloat(parseFloat(newDebt.minimum_payment).toFixed(2));
    }

    if (hasPromotionalAPR) {
      debtData.promotional_apr = parseFloat(parseFloat(newDebt.promotional_apr).toFixed(2));
      debtData.promotional_apr_end_date = newDebt.promotional_apr_end_date;
      debtData.regular_apr = parseFloat(parseFloat(newDebt.regular_apr).toFixed(2));
      debtData.apr = debtData.promotional_apr;
    } else if (!isInstallment) {
      debtData.apr = parseFloat(parseFloat(newDebt.apr).toFixed(2));
    }

    addDebtMutation.mutate(debtData, {
      onSuccess: () => {
        setNewDebt({ 
          name: "", bank: "", balance: "", apr: "", minimum_payment: "", payment_day: "1",
          is_installment: false, total_amount: "", number_of_installments: "", 
          installment_amount: "", start_date: "", end_date: "",
          promotional_apr: "", promotional_apr_end_date: "", regular_apr: ""
        });
        setIsInstallment(false);
        setHasPromotionalAPR(false);
      }
    });
  };

  const deleteDebt = async (id: string) => {
    deleteDebtMutation.mutate(id);
  };

  const updateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;

    updateDebtMutation.mutate({
      id: editingDebt.id,
      name: editingDebt.name,
      bank: editingDebt.bank,
      balance: editingDebt.balance,
      apr: editingDebt.apr,
      minimum_payment: editingDebt.minimum_payment,
      payment_day: editingDebt.payment_day,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingDebt(null);
      }
    });
  };

  return (
    <>
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
            {!isInstallment && !hasPromotionalAPR && (
              <div className="space-y-2">
                <Label htmlFor="debt-apr">{t('interestRate')}</Label>
                <Input
                  id="debt-apr"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newDebt.apr}
                  onChange={(e) => setNewDebt({ ...newDebt, apr: e.target.value })}
                  required
                />
              </div>
            )}
            {!isInstallment && (
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
            )}
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
                  <Label htmlFor="num-installments">{language === 'en' ? 'Number of Installments' : 'Número de Cuotas'}</Label>
                  <Input
                    id="num-installments"
                    type="number"
                    min="1"
                    value={newDebt.number_of_installments}
                    onChange={(e) => {
                      const numInstallments = parseInt(e.target.value);
                      const balance = parseFloat(newDebt.balance);
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
                        installment_amount: (!isNaN(balance) && numInstallments > 0) 
                          ? (balance / numInstallments).toFixed(2) 
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
          
          <div className="flex items-center space-x-2 mt-4 border-t pt-4">
            <input 
              type="checkbox" 
              id="has-promotional-apr" 
              checked={hasPromotionalAPR}
              onChange={(e) => setHasPromotionalAPR(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="has-promotional-apr">
              {language === 'en' ? 'Has Promotional APR' : 'Tiene APR Promocional'}
            </Label>
          </div>

          {hasPromotionalAPR && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="promotional-apr">{language === 'en' ? 'Promotional APR (%)' : 'APR Promocional (%)'}</Label>
                <Input
                  id="promotional-apr"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newDebt.promotional_apr}
                  onChange={(e) => setNewDebt({ ...newDebt, promotional_apr: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promotional-end-date">{language === 'en' ? 'Promotion End Date' : 'Fecha de Fin de Promoción'}</Label>
                <Input
                  id="promotional-end-date"
                  type="date"
                  value={newDebt.promotional_apr_end_date}
                  onChange={(e) => setNewDebt({ ...newDebt, promotional_apr_end_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regular-apr">{language === 'en' ? 'Regular APR (%)' : 'APR Regular (%)'}</Label>
                <Input
                  id="regular-apr"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newDebt.regular_apr}
                  onChange={(e) => setNewDebt({ ...newDebt, regular_apr: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

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
                    {debt.promotional_apr && debt.promotional_apr_end_date ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {language === 'en' ? 'Balance:' : 'Balance:'} £{debt.balance.toFixed(2)}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {language === 'en' ? '🎯 Promotional APR:' : '🎯 APR Promocional:'} {debt.promotional_apr}% 
                          {language === 'en' ? ' until ' : ' hasta '} 
                          {new Date(debt.promotional_apr_end_date).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'en' ? 'Then APR:' : 'Luego APR:'} {debt.regular_apr}%
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Balance:' : 'Balance:'} £{debt.balance.toFixed(2)} • APR: {debt.apr}%
                      </p>
                    )}
                    {debt.promotional_apr && debt.promotional_apr_end_date && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 hidden">
                        {language === 'en' ? 'Promo APR:' : 'APR Promo:'} {debt.promotional_apr}% 
                        {language === 'en' ? ' until ' : ' hasta '}{new Date(debt.promotional_apr_end_date).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES')}
                        {language === 'en' ? ', then ' : ', luego '}{debt.regular_apr}%
                      </p>
                    )}
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
                      {!(editingDebt?.promotional_apr && editingDebt?.promotional_apr_end_date) && (
                        <div className="space-y-2">
                          <Label htmlFor="edit-debt-apr">{t('interestRate')}</Label>
                          <Input
                            id="edit-debt-apr"
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingDebt?.apr ?? ''}
                            onChange={(e) => setEditingDebt(editingDebt ? {...editingDebt, apr: parseFloat(e.target.value) || 0} : null)}
                            required
                          />
                        </div>
                      )}
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                      title={language === 'en' ? 'Delete' : language === 'es' ? 'Eliminar' : 'Usuń'}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{language === 'en' ? 'Delete debt?' : language === 'es' ? '¿Eliminar deuda?' : 'Usunąć dług?'}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {language === 'en' ? 'This action cannot be undone.' : language === 'es' ? 'Esta acción no se puede deshacer.' : 'Tej operacji nie można cofnąć.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{language === 'en' ? 'Cancel' : language === 'es' ? 'Cancelar' : 'Anuluj'}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteDebt(debt.id)}>{language === 'en' ? 'Delete' : language === 'es' ? 'Eliminar' : 'Usuń'}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>

        {/* Paid Debts Section */}
        {paidDebts.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold mb-4 text-muted-foreground flex items-center gap-2">
              ✅ {language === 'en' ? 'Paid Debts' : language === 'es' ? 'Deudas Pagadas' : 'Spłacone Długi'}
            </h3>
            <div className="space-y-3 opacity-70">
              {paidDebts.map((debt) => (
                <div 
                  key={debt.id} 
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
                  onClick={() => {
                    setViewingDebtHistory(debt);
                    setIsHistoryDialogOpen(true);
                  }}
                >
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-300">{debt.name}</p>
                    {debt.is_installment ? (
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {debt.bank && `${debt.bank} • `}
                        {language === 'en' ? 'Paid in full' : language === 'es' ? 'Pagado completamente' : 'Spłacone w całości'}
                      </p>
                    ) : (
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {debt.bank && `${debt.bank} • `}
                        {language === 'en' ? 'Balance: £0.00 • Paid' : language === 'es' ? 'Balance: £0.00 • Pagado' : 'Saldo: £0.00 • Spłacone'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          title={language === 'en' ? 'Delete' : language === 'es' ? 'Eliminar' : 'Usuń'}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{language === 'en' ? 'Delete debt?' : language === 'es' ? '¿Eliminar deuda?' : 'Usunąć dług?'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {language === 'en' ? 'This action cannot be undone.' : language === 'es' ? 'Esta acción no se puede deshacer.' : 'Tej operacji nie można cofnąć.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{language === 'en' ? 'Cancel' : language === 'es' ? 'Cancelar' : 'Anuluj'}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDebt(debt.id)}>{language === 'en' ? 'Delete' : language === 'es' ? 'Eliminar' : 'Usuń'}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Payment History Dialog */}
    <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Payment History' : language === 'es' ? 'Historial de Pagos' : 'Historia Płatności'} - {viewingDebtHistory?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Original Amount */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'en' ? 'Original Amount' : language === 'es' ? 'Monto Original' : 'Pierwotna Kwota'}
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              £{((viewingDebtHistory?.total_amount || 0) + debtPayments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
            </p>
          </div>

          {/* Total Paid */}
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'en' ? 'Total Paid' : language === 'es' ? 'Total Pagado' : 'Razem Zapłacono'}
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              £{debtPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </p>
          </div>

          {/* Payment History */}
          <div>
            <h4 className="font-semibold mb-3">
              {language === 'en' ? 'Payments' : language === 'es' ? 'Pagos' : 'Płatności'} ({debtPayments.length})
            </h4>
            {debtPayments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === 'en' ? 'No payment records found' : language === 'es' ? 'No se encontraron registros de pago' : 'Nie znaleziono płatności'}
              </p>
            ) : (
              <div className="space-y-2">
                {debtPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">£{payment.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), "dd MMM yyyy")}
                      </p>
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
