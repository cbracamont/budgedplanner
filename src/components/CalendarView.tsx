import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trash2, Pencil } from "lucide-react";
import { formatCurrency, getTranslation, Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentItem {
  name: string;
  amount: number;
  dueDay: number;
  category: 'income' | 'debt' | 'fixed' | 'variable';
  status?: 'pending' | 'paid' | 'partial';
  id?: string;
  sourceTable?: 'income_sources' | 'debts' | 'fixed_expenses';
}

interface CalendarViewProps {
  payments: PaymentItem[];
  language: Language;
}

export const CalendarView = ({ payments, language }: CalendarViewProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentItem | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPaymentsForDay = (day: number) => {
    return payments.filter(p => p.dueDay === day);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'income': return 'bg-income/20 text-income border-income';
      case 'debt': return 'bg-debt/20 text-debt border-debt';
      case 'fixed': return 'bg-warning/20 text-warning border-warning';
      case 'variable': return 'bg-primary/20 text-primary border-primary';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid': return 'bg-success/10 text-success border-success';
      case 'partial': return 'bg-warning/10 text-warning border-warning';
      default: return 'bg-muted/10 text-muted-foreground border-muted';
    }
  };

  const deletePayment = async (payment: PaymentItem) => {
    if (!payment.id || !payment.sourceTable) {
      toast({ title: "Error", description: "Cannot delete this payment", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from(payment.sourceTable)
      .delete()
      .eq('id', payment.id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete payment", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Payment deleted successfully" });
    setSelectedPayment(null);
    window.location.reload();
  };

  const updatePayment = async () => {
    if (!editingPayment?.id || !editingPayment.sourceTable) return;

    const updateData: any = { name: editingPayment.name, amount: editingPayment.amount };

    const { error } = await supabase
      .from(editingPayment.sourceTable)
      .update(updateData)
      .eq('id', editingPayment.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update payment", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Payment updated successfully" });
    setIsEditDialogOpen(false);
    setEditingPayment(null);
    setSelectedPayment(null);
    window.location.reload();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
  const today = new Date();
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && 
                         currentMonth.getFullYear() === today.getFullYear();
  const currentDay = today.getDate();
  
  const monthName = currentMonth.toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  const calendarDays = Array(firstDayOfMonth).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const weekDays = language === 'en' 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <>
      <Card className="shadow-medium">
        <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <CardTitle className="text-base md:text-xl">{t('paymentCalendar')}</CardTitle>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('prev')}
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 md:h-10 md:w-10"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <span className="min-w-[140px] md:min-w-[200px] text-center font-semibold text-sm md:text-base">{monthName}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('next')}
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 md:h-10 md:w-10"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-primary-foreground/80 text-xs md:text-sm">
            {language === 'en' ? 'Click on a payment to view details' : 'Haz clic en un pago para ver detalles'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 md:pt-6">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[10px] md:text-sm font-semibold text-muted-foreground p-1 md:p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid - mobile optimized */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="min-h-16 md:min-h-24" />;
              }

              const dayPayments = getPaymentsForDay(day);
              const isToday = isCurrentMonth && day === currentDay;
              
              return (
                <div 
                  key={day}
                  className={`min-h-16 md:min-h-24 p-1 md:p-2 border rounded-lg transition-all ${
                    isToday ? 'border-primary bg-primary/5 ring-1 md:ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`text-[10px] md:text-sm font-semibold mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    {dayPayments.map((payment, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPayment(payment)}
                        className={`w-full text-left text-[8px] md:text-xs p-0.5 md:p-1 rounded border ${getCategoryColor(payment.category)} hover:opacity-80 transition-opacity cursor-pointer overflow-hidden`}
                      >
                        <div className="font-medium truncate leading-tight">{payment.name}</div>
                        <div className="font-semibold leading-tight">{formatCurrency(payment.amount)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-income border border-income"></div>
                <span className="text-xs md:text-sm text-muted-foreground">{t('income')}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-debt border border-debt"></div>
                <span className="text-xs md:text-sm text-muted-foreground">{t('debts')}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-warning border border-warning"></div>
                <span className="text-xs md:text-sm text-muted-foreground">{t('fixed')}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-primary border border-primary"></div>
                <span className="text-xs md:text-sm text-muted-foreground">{t('variable')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPayment?.name}</DialogTitle>
            <DialogDescription>
              {language === 'en' ? 'Payment details' : 'Detalles del pago'}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('amount')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dueDate')}</p>
                  <p className="text-2xl font-bold">{selectedPayment.dueDay}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('category')}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedPayment.category)}`}>
                  {t(selectedPayment.category)}
                </span>
              </div>
              {selectedPayment.status && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {language === 'en' ? 'Status' : 'Estado'}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(selectedPayment.status)}`}>
                    {selectedPayment.status === 'paid' 
                      ? (language === 'en' ? 'Paid' : 'Pagado')
                      : selectedPayment.status === 'partial'
                      ? (language === 'en' ? 'Partial' : 'Parcial')
                      : (language === 'en' ? 'Pending' : 'Pendiente')}
                  </span>
                </div>
              )}
              {selectedPayment.id && selectedPayment.sourceTable && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingPayment(selectedPayment);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Edit' : 'Editar'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => deletePayment(selectedPayment)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Delete' : 'Eliminar'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Edit Payment' : 'Editar Pago'}</DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <div className="space-y-4">
              <div>
                <Label>{language === 'en' ? 'Name' : 'Nombre'}</Label>
                <Input
                  value={editingPayment.name}
                  onChange={(e) => setEditingPayment({ ...editingPayment, name: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Amount' : 'Monto'}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingPayment.amount}
                  onChange={(e) => setEditingPayment({ ...editingPayment, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </Button>
            <Button onClick={updatePayment}>
              {language === 'en' ? 'Save Changes' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};