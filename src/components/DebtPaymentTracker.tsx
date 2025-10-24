import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Plus, Trash2, Calendar } from "lucide-react";
import { Language, getTranslation, formatCurrency } from "@/lib/i18n";
import { useDebts } from "@/hooks/useFinancialData";
import { useDebtPayments, useAddDebtPayment, useDeleteDebtPayment } from "@/hooks/useDebtPayments";
import { format } from "date-fns";
import { es, enGB } from "date-fns/locale";

interface DebtPaymentTrackerProps {
  language: Language;
}

export const DebtPaymentTracker = ({ language }: DebtPaymentTrackerProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { data: debts = [] } = useDebts();
  const { data: payments = [] } = useDebtPayments();
  const addPayment = useAddDebtPayment();
  const deletePayment = useDeleteDebtPayment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDebtId || !amount || parseFloat(amount) <= 0) {
      return;
    }

    await addPayment.mutateAsync({
      debt_id: selectedDebtId,
      amount: parseFloat(amount),
      payment_date: paymentDate,
      notes: notes || undefined,
    });

    // Reset form
    setSelectedDebtId("");
    setAmount("");
    setNotes("");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setDialogOpen(false);
  };

  const getDebtName = (debtId: string) => {
    const debt = debts.find((d) => d.id === debtId);
    return debt ? debt.name : "";
  };

  const locale = language === "es" ? es : enGB;

  return (
    <Card className="shadow-medium border-primary/20">
      <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <CardTitle>
              {language === "en" ? "Payment History" : "Historial de Pagos"}
            </CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {language === "en" ? "Record Payment" : "Registrar Pago"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {language === "en" ? "Record Debt Payment" : "Registrar Pago de Deuda"}
                </DialogTitle>
                <DialogDescription>
                  {language === "en"
                    ? "Track your debt payments to see your progress"
                    : "Registra tus pagos de deuda para ver tu progreso"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="debt-select">
                    {language === "en" ? "Select Debt" : "Seleccionar Deuda"}
                  </Label>
                  <Select value={selectedDebtId} onValueChange={setSelectedDebtId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          language === "en" ? "Choose a debt..." : "Elige una deuda..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {debts.map((debt) => (
                        <SelectItem key={debt.id} value={debt.id}>
                          {debt.name} ({debt.bank || "No bank"}) - {formatCurrency(debt.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">
                    {language === "en" ? "Payment Amount" : "Monto del Pago"}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-date">
                    {language === "en" ? "Payment Date" : "Fecha de Pago"}
                  </Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">
                    {language === "en" ? "Notes (optional)" : "Notas (opcional)"}
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder={
                      language === "en"
                        ? "Add any notes about this payment..."
                        : "Agrega notas sobre este pago..."
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={addPayment.isPending}>
                  {addPayment.isPending
                    ? language === "en"
                      ? "Recording..."
                      : "Registrando..."
                    : language === "en"
                    ? "Record Payment"
                    : "Registrar Pago"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="text-primary-foreground/80">
          {language === "en"
            ? "Track all your debt payments and see how your balance decreases"
            : "Registra todos tus pagos de deuda y ve cómo disminuye tu saldo"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {payments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {language === "en"
                ? "No payment history yet"
                : "Aún no hay historial de pagos"}
            </p>
            <p className="text-sm">
              {language === "en"
                ? "Start recording your debt payments to track progress"
                : "Comienza a registrar tus pagos para ver tu progreso"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {getDebtName(payment.debt_id)}
                    </p>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(payment.payment_date), "PPP", { locale })}
                    </span>
                  </div>
                  {payment.notes && (
                    <p className="text-sm text-muted-foreground italic mt-1">
                      {payment.notes}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePayment.mutate(payment.id)}
                  disabled={deletePayment.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
