import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { formatCurrency, getTranslation, Language } from "@/lib/i18n";

interface PaymentItem {
  name: string;
  amount: number;
  dueDay: number;
  category: 'income' | 'debt' | 'fixed' | 'variable';
}

interface CalendarViewProps {
  payments: PaymentItem[];
  language: Language;
}

export const CalendarView = ({ payments, language }: CalendarViewProps) => {
  const t = (key: string) => getTranslation(language, key);

  const getDaysInMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
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

  const daysInMonth = getDaysInMonth();
  const today = new Date().getDate();
  const currentMonth = new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Card className="shadow-medium">
      <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <CardTitle>{t('paymentCalendar')}</CardTitle>
        </div>
        <CardDescription className="text-primary-foreground/80">
          {currentMonth}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-7 gap-2">
          {/* Days grid */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dayPayments = getPaymentsForDay(day);
            const isToday = day === today;
            
            return (
              <div 
                key={day}
                className={`min-h-24 p-2 border rounded-lg ${
                  isToday ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayPayments.map((payment, idx) => (
                    <div 
                      key={idx}
                      className={`text-xs p-1 rounded border ${getCategoryColor(payment.category)}`}
                    >
                      <div className="font-medium truncate">{payment.name}</div>
                      <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                    </div>
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
  );
};
