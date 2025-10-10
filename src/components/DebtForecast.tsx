import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";

interface DebtForecastProps {
  totalDebts: number;
}

export const DebtForecast = ({ totalDebts }: DebtForecastProps) => {
  const [extraPayment, setExtraPayment] = useState<string>("");
  const [monthsToPayOff, setMonthsToPayOff] = useState<number | null>(null);
  const [yearsToPayOff, setYearsToPayOff] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

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
    const remainingMonths = months % 12;
    
    setMonthsToPayOff(months);
    setYearsToPayOff(years);
  };

  return (
    <Card className="shadow-medium border-primary/20">
      <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <CardTitle>Pronóstico de Pago de Deudas</CardTitle>
        </div>
        <CardDescription className="text-primary-foreground/80">
          Calcula cuánto tiempo tardarás en pagar tus deudas
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={calculatePayoffTime} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="extraPayment">
              Pago Extra Mensual Destinado a Deudas
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
              Monto adicional que puedes destinar cada mes al pago de deudas
            </p>
          </div>

          <Button type="submit" className="w-full">
            Calcular Tiempo de Pago
          </Button>
        </form>

        {monthsToPayOff !== null && (
          <div className="mt-6 p-4 bg-secondary rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold text-foreground">
                  Tiempo Estimado de Pago
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-primary">
                    {yearsToPayOff! > 0 && `${yearsToPayOff} ${yearsToPayOff === 1 ? 'año' : 'años'}`}
                    {yearsToPayOff! > 0 && (monthsToPayOff! % 12) > 0 && ' y '}
                    {(monthsToPayOff! % 12) > 0 && `${monthsToPayOff! % 12} ${(monthsToPayOff! % 12) === 1 ? 'mes' : 'meses'}`}
                    {yearsToPayOff === 0 && monthsToPayOff === 0 && 'Menos de 1 mes'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ({monthsToPayOff} meses en total)
                  </p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Total de deudas: <span className="font-semibold text-foreground">{formatCurrency(totalDebts)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pago extra mensual: <span className="font-semibold text-foreground">{formatCurrency(parseFloat(extraPayment) || 0)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {totalDebts === 0 && (
          <div className="mt-6 p-4 bg-success/10 rounded-lg">
            <p className="text-sm text-success font-medium">
              ¡Excelente! No tienes deudas registradas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
