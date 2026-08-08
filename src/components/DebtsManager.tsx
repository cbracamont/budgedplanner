import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionCard, SectionEmpty, SectionLoading } from "@/components/ui/section-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getTranslation, Language, ukBanks, formatCurrency } from "@/lib/i18n";
import { effectiveApr, promoStatus, monthlyInterest, interestOnlyPayment, installmentBreakdown, paymentCoversInterest } from "@/lib/debtMath";
import { debtInputSchema } from "@/components/validation/schemas";
import { friendlyError } from "@/lib/errorMessages";
import { useDebts, useAddDebt, useUpdateDebt, useDeleteDebt } from "@/hooks/useFinancialData";
import { useDebtPayments } from "@/hooks/useDebtPayments";
import { useAllPaymentHistory } from "@/hooks/usePaymentTracker";
import { useActiveProfile } from "@/hooks/useFinancialProfiles";
import { format, startOfMonth } from "date-fns";
import { parseLocalDate } from "@/lib/dateUtils";

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
  const { data: allDebts = [], isLoading } = useDebts();
  const { data: activeProfile } = useActiveProfile();
  const { data: allPaymentHistory = [] } = useAllPaymentHistory(activeProfile?.id);
  
  // Calculate adjusted balance for a debt by subtracting auto-generated payment_tracker entries
  // that haven't been reflected in the actual balance (which only updates via debt_payments trigger)
  const getAdjustedBalance = useCallback((debt: Debt) => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    
    // Get all payment_tracker entries for this debt up to current month
    const autoPayments = allPaymentHistory.filter(p => {
      if (p.source_id !== debt.id) return false;
      const pMonth = parseLocalDate(p.month_year);
      return pMonth <= currentMonthStart;
    });
    
    // Sum of auto-generated payments (these are NOT reflected in debt.balance)
    const totalAutoPayments = autoPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return Math.max(0, debt.balance - totalAutoPayments);
  }, [allPaymentHistory]);

  // Filter out paid debts (adjusted balance = 0)
  const debts = allDebts.filter(debt => getAdjustedBalance(debt) > 0);
  const paidDebts = allDebts.filter(debt => getAdjustedBalance(debt) === 0);

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

  // Combine manual debt_payments + auto-generated payment_tracker entries for the viewed debt
  const combinedPaymentHistory = useMemo(() => {
    if (!viewingDebtHistory) return [];

    // Manual payments from debt_payments table
    const manualPayments = debtPayments.map(p => ({
      id: p.id,
      amount: p.amount,
      payment_date: p.payment_date,
      notes: p.notes,
      source: 'manual' as const,
    }));

    // Auto-generated payments from payment_tracker
    const autoPayments = allPaymentHistory
      .filter(p => p.source_id === viewingDebtHistory.id)
      .map(p => ({
        id: p.id,
        amount: p.amount,
        payment_date: p.payment_date || p.month_year,
        notes: p.notes,
        source: 'auto' as const,
      }));

    // Combine and sort by date descending
    return [...manualPayments, ...autoPayments].sort((a, b) => 
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
  }, [viewingDebtHistory, debtPayments, allPaymentHistory]);

  const totalPaidCombined = useMemo(() => 
    combinedPaymentHistory.reduce((sum, p) => sum + p.amount, 0),
    [combinedPaymentHistory]
  );

  // Manual payments sum (these already reduced debt.balance via DB trigger)
  const manualPaymentsSum = useMemo(() => 
    debtPayments.reduce((sum, p) => sum + p.amount, 0),
    [debtPayments]
  );

  const originalAmount = useMemo(() => {
    if (!viewingDebtHistory) return 0;
    if (viewingDebtHistory.is_installment && viewingDebtHistory.total_amount) {
      return viewingDebtHistory.total_amount;
    }
    // debt.balance was already reduced by manual payments via trigger,
    // so original = current DB balance + manual payments only
    return viewingDebtHistory.balance + manualPaymentsSum;
  }, [viewingDebtHistory, manualPaymentsSum]);

  // Remaining = original - everything paid (manual + auto)
  const remainingBalance = useMemo(() => 
    Math.max(0, originalAmount - totalPaidCombined),
    [originalAmount, totalPaidCombined]
  );

  useEffect(() => {
    const total = debts.reduce((sum, debt) => sum + debt.minimum_payment, 0);
    onDebtsChange?.(total);
  }, [debts, onDebtsChange]);

  const validationMessages = {
    en: {
      balance: "Enter a total balance greater than 0.",
      apr: "Enter an APR between 0 and 100%.",
      minPayment: "Enter a minimum payment greater than 0.",
      installments: "Enter at least 1 instalment.",
      startDate: "Choose a start date for the instalment plan.",
      promoDate: "Choose the date the promotional APR ends.",
      promoRegular: "Enter the regular APR that applies after the promotion.",
      promoPast: "The promotional end date must be in the future.",
      neverPaidOff: (min: string, needed: string) =>
        `A payment of ${min} does not cover the monthly interest (${needed}). The balance would never go down.`,
    },
    es: {
      balance: "Introduce un balance total mayor que 0.",
      apr: "Introduce un APR entre 0 y 100%.",
      minPayment: "Introduce un pago mínimo mayor que 0.",
      installments: "Introduce al menos 1 cuota.",
      startDate: "Elige la fecha de inicio del plan de cuotas.",
      promoDate: "Elige la fecha en que termina el APR promocional.",
      promoRegular: "Introduce el APR regular que aplica al terminar la promoción.",
      promoPast: "La fecha de fin de la promoción debe ser futura.",
      neverPaidOff: (min: string, needed: string) =>
        `Un pago de ${min} no cubre el interés mensual (${needed}). El balance nunca bajaría.`,
    },
    pt: {
      balance: "Introduza um saldo total maior que 0.",
      apr: "Introduza uma TAEG entre 0 e 100%.",
      minPayment: "Introduza um pagamento mínimo maior que 0.",
      installments: "Introduza pelo menos 1 prestação.",
      startDate: "Escolha a data de início do plano de prestações.",
      promoDate: "Escolha a data em que termina a TAEG promocional.",
      promoRegular: "Introduza a TAEG regular aplicada após a promoção.",
      promoPast: "A data de fim da promoção deve ser futura.",
      neverPaidOff: (min: string, needed: string) =>
        `Um pagamento de ${min} não cobre os juros mensais (${needed}). O saldo nunca desceria.`,
    },
  }[language === 'es' ? 'es' : language === 'pt' ? 'pt' : 'en'];

  const showError = (message: string) =>
    toast({ title: language === 'en' ? 'Check the form' : language === 'pt' ? 'Verifique o formulário' : 'Revisa el formulario', description: message, variant: 'destructive' });

  const addDebt = async (e: React.FormEvent) => {
    e.preventDefault();

    const balanceValue = parseFloat(newDebt.balance);
    if (!Number.isFinite(balanceValue) || balanceValue <= 0) return showError(validationMessages.balance);

    if (isInstallment) {
      const installments = parseInt(newDebt.number_of_installments);
      if (!Number.isFinite(installments) || installments < 1) return showError(validationMessages.installments);
      if (!newDebt.start_date) return showError(validationMessages.startDate);
    } else {
      const minPay = parseFloat(newDebt.minimum_payment);
      if (!Number.isFinite(minPay) || minPay <= 0) return showError(validationMessages.minPayment);
    }

    if (hasPromotionalAPR) {
      const promo = parseFloat(newDebt.promotional_apr);
      const regular = parseFloat(newDebt.regular_apr);
      if (!Number.isFinite(promo) || promo < 0 || promo > 100) return showError(validationMessages.apr);
      if (!newDebt.promotional_apr_end_date) return showError(validationMessages.promoDate);
      if (parseLocalDate(newDebt.promotional_apr_end_date) < startOfMonth(new Date())) return showError(validationMessages.promoPast);
      if (!Number.isFinite(regular) || regular < 0 || regular > 100) return showError(validationMessages.promoRegular);
    } else if (!isInstallment) {
      const aprValue = parseFloat(newDebt.apr);
      if (!Number.isFinite(aprValue) || aprValue < 0 || aprValue > 100) return showError(validationMessages.apr);
    }

    // A payment that does not beat the first month of interest never clears the debt.
    if (!isInstallment) {
      const minPay = parseFloat(newDebt.minimum_payment);
      const aprForCheck = hasPromotionalAPR ? parseFloat(newDebt.promotional_apr) : parseFloat(newDebt.apr);
      if (Number.isFinite(aprForCheck) && aprForCheck > 0 && !paymentCoversInterest(balanceValue, minPay, aprForCheck)) {
        return showError(
          validationMessages.neverPaidOff(formatCurrency(minPay), formatCurrency(interestOnlyPayment(balanceValue, aprForCheck)))
        );
      }
    }

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
    <SectionCard
      accent="debt"
      icon={CreditCard}
      title={t('debts')}
      description={language === 'en' ? 'Manage your debts and payment dates' : language === 'pt' ? 'Gerencie as suas dívidas e datas de pagamento' : 'Administra tus deudas y fechas de pago'}
    >
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
                        const start = parseLocalDate(startDate);
                        endDate = format(new Date(start.getFullYear(), start.getMonth() + numInstallments, start.getDate()), 'yyyy-MM-dd');
                      }

                      setNewDebt({ 
                        ...newDebt, 
                        number_of_installments: e.target.value,
                        installment_amount: (!isNaN(balance) && numInstallments > 0) 
                          ? installmentBreakdown(balance, numInstallments).regular.toFixed(2) 
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
                  {(() => {
                    const n = parseInt(newDebt.number_of_installments);
                    const bal = parseFloat(newDebt.balance);
                    if (!Number.isFinite(n) || n < 1 || !Number.isFinite(bal) || bal <= 0) return null;
                    const { regular, final } = installmentBreakdown(bal, n);
                    if (Math.abs(final - regular) < 0.005) return null;
                    return (
                      <p className="text-xs text-muted-foreground">
                        {language === 'en'
                          ? `Last instalment: ${formatCurrency(final)} (rounding adjustment)`
                          : language === 'pt'
                            ? `Última prestação: ${formatCurrency(final)} (ajuste de arredondamento)`
                            : `Última cuota: ${formatCurrency(final)} (ajuste de redondeo)`}
                      </p>
                    );
                  })()}
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
                      
                      // Calculate next payment date (first payment is next month from start date)
                      let nextPaymentDate = "";
                      let endDate = "";
                      
                      if (startDate && numInstallments > 0) {
                        const start = parseLocalDate(startDate);
                        nextPaymentDate = format(new Date(start.getFullYear(), start.getMonth() + 1, start.getDate()), 'yyyy-MM-dd');
                        endDate = format(new Date(start.getFullYear(), start.getMonth() + numInstallments, start.getDate()), 'yyyy-MM-dd');
                      }
                      
                      setNewDebt({ 
                        ...newDebt, 
                        start_date: startDate, 
                        end_date: endDate 
                      });
                    }}
                    required
                  />
                  {newDebt.start_date && newDebt.number_of_installments && (
                    <p className="text-xs text-muted-foreground">
                      {language === 'en' ? 'First payment:' : 'Primer pago:'} {(() => {
                        const start = parseLocalDate(newDebt.start_date);
                        return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate()).toLocaleDateString();
                      })()}
                    </p>
                  )}
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

        {isLoading ? (
          <SectionLoading />
        ) : debts.length === 0 ? (
          <SectionEmpty
            icon={CreditCard}
            title={t('emptyDebtsTitle')}
            description={t('emptyDebtsDesc')}
          />
        ) : (
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
                      {formatCurrency(debt.minimum_payment)}/{language === 'en' ? 'month' : language === 'pt' ? 'mês' : 'mes'} • {language === 'en' ? 'Day' : language === 'pt' ? 'Dia' : 'Día'} {debt.payment_day}
                    </p>
                    {(() => {
                      const balance = getAdjustedBalance(debt);
                      const status = promoStatus(debt);
                      const currentApr = effectiveApr(debt);
                      const interest = monthlyInterest(balance, currentApr);
                      const covers = paymentCoversInterest(balance, debt.minimum_payment, currentApr);
                      const dateLocale = language === 'en' ? 'en-GB' : language === 'pt' ? 'pt-PT' : 'es-ES';
                      return (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {language === 'en' ? 'Balance:' : language === 'pt' ? 'Saldo:' : 'Balance:'} {formatCurrency(balance)} • APR: {currentApr}%
                            {interest > 0 && (
                              <> • {language === 'en' ? 'interest/month' : language === 'pt' ? 'juros/mês' : 'interés/mes'}: {formatCurrency(interest)}</>
                            )}
                          </p>
                          {status === 'active' && (
                            <p className="text-xs text-primary font-medium">
                              {language === 'en' ? 'Promotional APR' : language === 'pt' ? 'TAEG promocional' : 'APR promocional'} {debt.promotional_apr}%
                              {language === 'en' ? ' until ' : language === 'pt' ? ' até ' : ' hasta '}
                              {parseLocalDate(debt.promotional_apr_end_date as string).toLocaleDateString(dateLocale)}
                              {' • '}
                              {language === 'en' ? 'then ' : language === 'pt' ? 'depois ' : 'luego '}{debt.regular_apr ?? debt.apr}%
                            </p>
                          )}
                          {status === 'expired' && (
                            <p className="text-xs text-destructive font-medium">
                              {language === 'en'
                                ? `Promotion ended ${parseLocalDate(debt.promotional_apr_end_date as string).toLocaleDateString(dateLocale)} — now charging ${currentApr}%`
                                : language === 'pt'
                                  ? `Promoção terminou em ${parseLocalDate(debt.promotional_apr_end_date as string).toLocaleDateString(dateLocale)} — agora cobra ${currentApr}%`
                                  : `La promoción terminó el ${parseLocalDate(debt.promotional_apr_end_date as string).toLocaleDateString(dateLocale)} — ahora cobra ${currentApr}%`}
                            </p>
                          )}
                          {!covers && balance > 0 && currentApr > 0 && (
                            <p className="text-xs text-destructive">
                              {language === 'en'
                                ? `The payment does not cover the interest — pay at least ${formatCurrency(interestOnlyPayment(balance, currentApr))}/month.`
                                : language === 'pt'
                                  ? `O pagamento não cobre os juros — pague pelo menos ${formatCurrency(interestOnlyPayment(balance, currentApr))}/mês.`
                                  : `El pago no cubre el interés — paga al menos ${formatCurrency(interestOnlyPayment(balance, currentApr))}/mes.`}
                            </p>
                          )}
                        </>
                      );
                    })()}
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
        )}

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
    </SectionCard>

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
              £{originalAmount.toFixed(2)}
            </p>
          </div>

          {/* Total Paid */}
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'en' ? 'Total Paid' : language === 'es' ? 'Total Pagado' : 'Razem Zapłacono'}
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              £{totalPaidCombined.toFixed(2)}
            </p>
          </div>

          {/* Remaining Balance */}
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'en' ? 'Remaining Balance' : language === 'es' ? 'Saldo Restante' : 'Pozostałe Saldo'}
            </p>
            <p className="text-2xl font-bold text-debt">
              £{remainingBalance.toFixed(2)}
            </p>
          </div>

          {/* Payment History */}
          <div>
            <h4 className="font-semibold mb-3">
              {language === 'en' ? 'Payments' : language === 'es' ? 'Pagos' : 'Płatności'} ({combinedPaymentHistory.length})
            </h4>
            {combinedPaymentHistory.length === 0 ? (
              <SectionEmpty
                title={language === 'en' ? 'No payment records found' : language === 'pt' ? 'Nenhum pagamento registrado' : 'No se encontraron registros de pago'}
              />
            ) : (
              <div className="space-y-2">
                {combinedPaymentHistory.map((payment) => (
                  <div key={`${payment.source}-${payment.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">£{payment.amount.toFixed(2)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          payment.source === 'auto' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {payment.source === 'auto' 
                            ? (language === 'es' ? 'Automático' : 'Auto') 
                            : (language === 'es' ? 'Manual' : 'Manual')}
                        </span>
                      </div>
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
