import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, Calendar } from "lucide-react";
import { formatCurrency, getTranslation, Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

interface DebtForecastProps {
  totalDebts: number;
  language: Language;
}

interface Debt {
  balance: number;
  apr: number;
  minimum_payment: number;
}

export const ImprovedDebtForecast = ({ totalDebts, language }: DebtForecastProps) => {
  const t = (key: string) => getTranslation(language, key);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [extraPayment, setExtraPayment] = useState<string>("");
  const [debtFreeDate, setDebtFreeDate] = useState<Date | null>(null);
  const [monthsToPayOff, setMonthsToPayOff] = useState<number | null>(null);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("debts")
      .select("balance, apr, minimum_payment");

    if (data) {
      setDebts(data);
    }
  };

  const calculateDebtFreeDate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (debts.length === 0 || totalDebts <= 0) {
      setDebtFreeDate(null);
      setMonthsToPayOff(null);
      return;
    }

    const extra = parseFloat(extraPayment) || 0;
    let totalMonths = 0;
    
    // Sort debts by APR (highest first) for avalanche method
    const sortedDebts = [...debts].sort((a, b) => b.apr - a.apr);
    let remainingExtra = extra;

    sortedDebts.forEach((debt) => {
      const monthlyPayment = debt.minimum_payment + remainingExtra;
      const monthlyRate = debt.apr / 100 / 12;
      
      if (monthlyPayment <= 0) {
        return;
      }

      let months = 0;
      
      if (monthlyRate === 0) {
        months = Math.ceil(debt.balance / monthlyPayment);
      } else {
        // Formula: n = log(P / (P - B*r)) / log(1 + r)
        // where P = payment, B = balance, r = monthly rate
        const numerator = Math.log(monthlyPayment / (monthlyPayment - debt.balance * monthlyRate));
        const denominator = Math.log(1 + monthlyRate);
        months = Math.ceil(numerator / denominator);
      }

      totalMonths = Math.max(totalMonths, months);
    });

    setMonthsToPayOff(totalMonths);
    
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + totalMonths);
    setDebtFreeDate(futureDate);
  };

  const yearsToPayOff = monthsToPayOff ? Math.floor(monthsToPayOff / 12) : 0;
  const remainingMonths = monthsToPayOff ? monthsToPayOff % 12 : 0;

  return (
    <Card className="shadow-medium border-primary/20">
      <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <CardTitle>{t('debtPayoffForecast')}</CardTitle>
        </div>
        <CardDescription className="text-primary-foreground/80">
          {t('debtPayoffDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={calculateDebtFreeDate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="extraPayment">
              {t('extraMonthlyPayment')}
            </Label>
            <Input
              id="extraPayment"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
              className="text-lg font-medium"
            />
            <p className="text-xs text-muted-foreground">
              {t('extraPaymentDescription')}
            </p>
          </div>

          <Button type="submit" className="w-full">
            {t('calculatePayoffTime')}
          </Button>
        </form>

        {debtFreeDate && monthsToPayOff !== null && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-success mt-1" />
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">
                    {language === 'en' ? 'Projected Debt-Free Date:' : 'Fecha Proyectada Libre de Deuda:'}
                  </p>
                  <p className="text-2xl font-bold text-success">
                    {debtFreeDate.toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-secondary rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <p className="font-semibold text-foreground">
                    {t('estimatedPayoffTime')}
                  </p>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">
                      {yearsToPayOff > 0 && `${yearsToPayOff} ${yearsToPayOff === 1 ? t('year') : t('years')}`}
                      {yearsToPayOff > 0 && remainingMonths > 0 && ` ${language === 'en' ? 'and' : 'y'} `}
                      {remainingMonths > 0 && `${remainingMonths} ${remainingMonths === 1 ? t('month') : t('months')}`}
                      {yearsToPayOff === 0 && monthsToPayOff === 0 && t('lessThanMonth')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ({monthsToPayOff} {t('monthsInTotal')})
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {t('totalDebts')}: <span className="font-semibold text-foreground">{formatCurrency(totalDebts)}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('extraMonthlyPayment')}: <span className="font-semibold text-foreground">{formatCurrency(parseFloat(extraPayment) || 0)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {totalDebts === 0 && (
          <div className="mt-6 p-4 bg-success/10 rounded-lg">
            <p className="text-sm text-success font-medium">
              {t('noDebts')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};