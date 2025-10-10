import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CalendarDays, PiggyBank } from "lucide-react";

interface BudgetSummaryProps {
  totalIncome: number;
  totalDebts: number;
}

export const BudgetSummary = ({ totalIncome, totalDebts }: BudgetSummaryProps) => {
  const monthlyBalance = totalIncome - totalDebts;
  const weeklyBalance = monthlyBalance / 4;
  const isPositive = monthlyBalance >= 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-medium overflow-hidden">
        <CardHeader className="bg-gradient-primary text-primary-foreground pb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            <CardTitle className="text-lg">Resumen Financiero</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Ingresos</p>
              <p className="text-2xl font-bold text-income">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Deudas</p>
              <p className="text-2xl font-bold text-debt">
                {formatCurrency(totalDebts)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`shadow-medium ${isPositive ? 'border-success' : 'border-warning'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Presupuesto Mensual</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${isPositive ? 'text-success' : 'text-warning'}`}>
            {formatCurrency(monthlyBalance)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {isPositive ? 'Disponible para ahorrar o gastar' : 'Déficit mensual'}
          </p>
        </CardContent>
      </Card>

      <Card className={`shadow-medium ${isPositive ? 'border-success' : 'border-warning'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Presupuesto Semanal</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${isPositive ? 'text-success' : 'text-warning'}`}>
            {formatCurrency(weeklyBalance)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Aproximadamente por semana
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
