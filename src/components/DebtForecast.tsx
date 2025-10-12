import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";
import { formatCurrency, getTranslation, Language } from "@/lib/i18n";

interface DebtForecastProps {
  totalDebts: number;
  language: Language;
}

export const DebtForecast = ({ totalDebts, language }: DebtForecastProps) => {
  const t = (key: string) => getTranslation(language, key);
  const [extraPayment, setExtraPayment] = useState<string>("");
  const [monthsToPayOff, setMonthsToPayOff] = useState<number | null>(null);
  const [yearsToPayOff, setYearsToPayOff] = useState<number | null>(null);

  const calculatePayoffTime = (e: React.FormEvent) => {
    e.preventDefault();
    const payment = parseFloat(extraPayment) || 0;
    
    if (payment <= 0 || totalDebts <= 0) {
      setMonthsToPayOff(null);
      setYearsToPayOff(null);
      return;
    }

    const months = Math.ceil(totalDebts / payment);
    const years = Math.floor(months / 12);
    
    setMonthsToPayOff(months);
    setYearsToPayOff(years);
  };

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
        <form onSubmit={calculatePayoffTime} className="space-y-4">
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

        {monthsToPayOff !== null && (
          <div className="mt-6 p-4 bg-secondary rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold text-foreground">
                  {t('estimatedPayoffTime')}
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-primary">
                    {yearsToPayOff! > 0 && `${yearsToPayOff} ${yearsToPayOff === 1 ? t('year') : t('years')}`}
                    {yearsToPayOff! > 0 && (monthsToPayOff! % 12) > 0 && ` ${language === 'en' ? 'and' : 'y'} `}
                    {(monthsToPayOff! % 12) > 0 && `${monthsToPayOff! % 12} ${(monthsToPayOff! % 12) === 1 ? t('month') : t('months')}`}
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
