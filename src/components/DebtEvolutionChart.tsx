import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, LineChart as LineChartIcon } from "lucide-react";
import { Language, getTranslation, formatCurrency } from "@/lib/i18n";
import { useDebts } from "@/hooks/useFinancialData";
import { useDebtPayments } from "@/hooks/useDebtPayments";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { es, enGB } from "date-fns/locale";

interface DebtEvolutionChartProps {
  language: Language;
}

export const DebtEvolutionChart = ({ language }: DebtEvolutionChartProps) => {
  const t = (key: string) => getTranslation(language, key);
  const { data: debts = [] } = useDebts();
  const { data: payments = [] } = useDebtPayments();

  const locale = language === "es" ? es : enGB;

  const chartData = useMemo(() => {
    if (debts.length === 0) return [];

    // Get the earliest payment date or 6 months ago, whichever is earlier
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);
    
    const earliestPayment = payments.length > 0
      ? new Date(Math.min(...payments.map((p) => new Date(p.payment_date).getTime())))
      : sixMonthsAgo;

    const startDate = earliestPayment < sixMonthsAgo ? earliestPayment : sixMonthsAgo;

    // Generate monthly intervals
    const months = eachMonthOfInterval({
      start: startOfMonth(startDate),
      end: startOfMonth(today),
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      // Calculate total debt balance at the end of this month
      let totalBalance = 0;

      debts.forEach((debt) => {
        // Start with current balance
        let balance = debt.balance;

        // Add back all payments made up to this month
        const paymentsUpToMonth = payments.filter(
          (p) =>
            p.debt_id === debt.id &&
            new Date(p.payment_date) >= monthStart &&
            new Date(p.payment_date) < monthEnd
        );

        // Add back the payments to get the balance at the start of the month
        const paymentsAfterMonth = payments.filter(
          (p) => p.debt_id === debt.id && new Date(p.payment_date) >= monthEnd
        );

        balance += paymentsAfterMonth.reduce((sum, p) => sum + p.amount, 0);
        totalBalance += balance;
      });

      return {
        month: format(month, "MMM yyyy", { locale }),
        balance: Math.round(totalBalance * 100) / 100,
      };
    });
  }, [debts, payments, locale]);

  const totalCurrentDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Card className="shadow-medium border-primary/20">
      <CardHeader className="bg-gradient-success text-success-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          <CardTitle>
            {language === "en" ? "Debt Evolution" : "Evolución de Deudas"}
          </CardTitle>
        </div>
        <CardDescription className="text-success-foreground/80">
          {language === "en"
            ? "See how your total debt has decreased over time"
            : "Ve cómo tu deuda total ha disminuido con el tiempo"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {chartData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <LineChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {language === "en"
                ? "No debt history available"
                : "No hay historial de deudas disponible"}
            </p>
            <p className="text-sm">
              {language === "en"
                ? "Start making payments to see your progress"
                : "Comienza a hacer pagos para ver tu progreso"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Current Total Debt" : "Deuda Total Actual"}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalCurrentDebt)}
                </p>
              </div>
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Total Paid" : "Total Pagado"}
                </p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `£${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), language === "en" ? "Balance" : "Saldo"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    name={language === "en" ? "Total Debt" : "Deuda Total"}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
