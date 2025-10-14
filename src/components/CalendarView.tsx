import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, getTranslation, Language } from "@/lib/i18n";

interface PaymentItem {
  name: string;
  amount: number;
  dueDay: number;
  category: 'income' | 'debt' | 'fixed' | 'variable';
  status?: 'pending' | 'paid' | 'partial';
  id?: string;
}

interface CalendarViewProps {
  payments: PaymentItem[];
  language: Language;
}

export const CalendarView = ({ payments, language }: CalendarViewProps) => {
  const t = (key: string) => getTranslation(language, key);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);

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

  // Create array with empty slots for days before month starts
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
              <CardTitle>{t('paymentCalendar')}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('prev')}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="min-w-[200px] text-center font-semibold">{monthName}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('next')}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-primary-foreground/80">
            {language === 'en' ? 'Click on a payment to view details' : 'Haz clic en un pago para ver detalles'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="min-h-24" />;
              }

              const dayPayments = getPaymentsForDay(day);
              const isToday = isCurrentMonth && day === currentDay;
              
              return (
                <div 
                  key={day}
                  className={`min-h-24 p-2 border rounded-lg transition-all ${
                    isToday ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayPayments.map((payment, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPayment(payment)}
                        className={`w-full text-left text-xs p-1 rounded border ${getCategoryColor(payment.category)} hover:opacity-80 transition-opacity cursor-pointer`}
                      >
                        <div className="font-medium truncate">{payment.name}</div>
                        <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-income border border-income"></div>
                <span className="text-sm text-muted-foreground">{t('income')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-debt border border-debt"></div>
                <span className="text-sm text-muted-foreground">{t('debts')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-warning border border-warning"></div>
                <span className="text-sm text-muted-foreground">{t('fixed')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary border border-primary"></div>
                <span className="text-sm text-muted-foreground">{t('variable')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
