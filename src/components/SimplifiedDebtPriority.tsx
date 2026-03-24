import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, Language } from "@/lib/i18n";
import { AlertCircle, TrendingDown } from "lucide-react";
import { useDebtPayments } from "@/hooks/useDebtPayments";
import { differenceInMonths, startOfMonth } from "date-fns";

interface Debt {
  id: string;
  name: string;
  balance: number;
  minimum_payment: number;
  apr: number;
}

interface SimplifiedDebtPriorityProps {
  debts: Debt[];
  method: "avalanche" | "snowball" | "hybrid";
  language?: Language;
  currentMonth?: Date;
}

export const SimplifiedDebtPriority = ({ debts, method, language = "en", currentMonth }: SimplifiedDebtPriorityProps) => {
  const { data: payments = [] } = useDebtPayments();

  // Calculate real balances considering all payments made
  const debtsWithRealBalance = useMemo(() => {
    return debts.map(debt => {
      const totalPaid = payments
        .filter(p => p.debt_id === debt.id)
        .reduce((sum, p) => sum + p.amount, 0);

      // debt.balance is already updated by the trigger, but if viewing a different month
      // we need to project. The real current balance = debt.balance (trigger-updated).
      // For future months, subtract projected minimum payments per month.
      // For past months, add back payments made after that month.
      const today = new Date();
      const todayMonth = startOfMonth(today);
      const viewingMonth = currentMonth ? startOfMonth(currentMonth) : todayMonth;
      const monthDiff = differenceInMonths(viewingMonth, todayMonth);

      let projectedBalance = debt.balance;

      if (monthDiff > 0) {
        // Future: project balance reduction by minimum payments
        projectedBalance = Math.max(0, debt.balance - (debt.minimum_payment * monthDiff));
      } else if (monthDiff < 0) {
        // Past: add back payments made after viewing month
        const paymentsAfter = payments
          .filter(p => p.debt_id === debt.id && new Date(p.payment_date) > viewingMonth)
          .reduce((sum, p) => sum + p.amount, 0);
        projectedBalance = debt.balance + paymentsAfter;
      }

      const originalBalance = projectedBalance + totalPaid;

      return {
        ...debt,
        realBalance: Math.max(0, projectedBalance),
        totalPaid,
        originalBalance,
      };
    });
  }, [debts, payments, currentMonth]);

  if (debts.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{language === "en" ? "No active debts to prioritize" : language === "es" ? "No hay deudas activas para priorizar" : "Sem dívidas ativas para priorizar"}</p>
      </div>
    );
  }

  const t = {
    en: {
      totalMonthlyDebt: "Total Monthly Debt",
      debtFreeIn: "Debt Free in",
      months: "months",
      balance: "Balance",
      monthlyPayment: "Monthly Payment",
      payoffTime: "Payoff Time",
      timeRemaining: "Time Remaining",
      payoffProgress: "Payoff Progress",
      sortedBy: "Sorted by",
      highestAPR: "highest APR",
      smallestBalance: "smallest balance",
      hybridScore: "hybrid score",
      payFirst: "Pay the top priority debt first",
      fromNow: "from now",
    },
    es: {
      totalMonthlyDebt: "Pago Mensual Total",
      debtFreeIn: "Libre de deuda en",
      months: "meses",
      balance: "Saldo",
      monthlyPayment: "Pago Mensual",
      payoffTime: "Tiempo de Pago",
      timeRemaining: "Tiempo Restante",
      payoffProgress: "Progreso de Pago",
      sortedBy: "Ordenado por",
      highestAPR: "mayor APR",
      smallestBalance: "menor saldo",
      hybridScore: "puntuación híbrida",
      payFirst: "Paga primero la deuda con mayor prioridad",
      fromNow: "desde ahora",
    },
    pt: {
      totalMonthlyDebt: "Pagamento Mensal Total",
      debtFreeIn: "Livre de dívida em",
      months: "meses",
      balance: "Saldo",
      monthlyPayment: "Pagamento Mensal",
      payoffTime: "Tempo de Pagamento",
      timeRemaining: "Tempo Restante",
      payoffProgress: "Progresso de Pagamento",
      sortedBy: "Ordenado por",
      highestAPR: "maior APR",
      smallestBalance: "menor saldo",
      hybridScore: "pontuação híbrida",
      payFirst: "Pague primeiro a dívida com maior prioridade",
      fromNow: "a partir de agora",
    },
  }[language];

  const calculatePriorityScore = (debt: Debt): number => {
    const maxAPR = Math.max(...debts.map(d => d.apr));
    const maxBalance = Math.max(...debtsWithRealBalance.map(d => d.realBalance));

    if (method === "avalanche") {
      return Math.round((debt.apr / maxAPR) * 10);
    } else if (method === "snowball") {
      const db = debtsWithRealBalance.find(d => d.id === debt.id);
      return maxBalance > 0 ? Math.round(((maxBalance - (db?.realBalance || 0)) / maxBalance) * 10) : 5;
    } else {
      const db = debtsWithRealBalance.find(d => d.id === debt.id);
      const aprScore = (debt.apr / maxAPR) * 5;
      const balanceScore = maxBalance > 0 ? ((maxBalance - (db?.realBalance || 0)) / maxBalance) * 5 : 2.5;
      return Math.round(aprScore + balanceScore);
    }
  };

  const sortedDebts = [...debtsWithRealBalance].sort((a, b) => {
    const scoreA = calculatePriorityScore(a);
    const scoreB = calculatePriorityScore(b);
    return scoreB - scoreA;
  });

  const getPayoffProgress = (debt: typeof sortedDebts[0]): number => {
    if (debt.originalBalance === 0) return 0;
    return Math.min(100, (debt.totalPaid / debt.originalBalance) * 100);
  };

  const getPriorityColor = (score: number): string => {
    if (score >= 8) return "border-red-500 dark:border-red-400";
    if (score >= 5) return "border-orange-500 dark:border-orange-400";
    return "border-green-500 dark:border-green-400";
  };

  const getPriorityBadgeColor = (score: number): string => {
    if (score >= 8) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    if (score >= 5) return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
  };

  const totalMonthlyDebt = debts.reduce((sum, d) => sum + d.minimum_payment, 0);
  const totalBalance = debtsWithRealBalance.reduce((sum, d) => sum + d.realBalance, 0);
  const averageMonthsToPayoff = totalMonthlyDebt > 0 ? Math.ceil(totalBalance / totalMonthlyDebt) : 0;

  // Calculate months offset from selected month
  const today = new Date();
  const viewingMonth = currentMonth ? startOfMonth(currentMonth) : startOfMonth(today);
  const monthOffset = differenceInMonths(viewingMonth, startOfMonth(today));

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t.totalMonthlyDebt}</p>
              <p className="text-2xl font-bold">{formatCurrency(totalMonthlyDebt)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t.debtFreeIn}</p>
              <p className="text-2xl font-bold">{averageMonthsToPayoff} {t.months}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sortedDebts.map((debt, index) => {
          const priorityScore = calculatePriorityScore(debt);
          const payoffProgress = getPayoffProgress(debt);
          const monthsToPayoff = debt.minimum_payment > 0 ? Math.ceil(debt.realBalance / debt.minimum_payment) : 0;
          const timeRemaining = Math.max(0, monthsToPayoff - Math.max(0, monthOffset));

          return (
            <Card
              key={debt.id}
              className={`border-l-4 ${getPriorityColor(priorityScore)} shadow-sm hover:shadow-md transition-shadow`}
            >
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                        <h3 className="font-semibold text-lg">{debt.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">APR: {debt.apr.toFixed(2)}%</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(priorityScore)}`}>
                      Priority: {priorityScore}/10
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t.balance}</p>
                      <p className="font-semibold">{formatCurrency(debt.realBalance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t.monthlyPayment}</p>
                      <p className="font-semibold">{formatCurrency(debt.minimum_payment)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t.payoffTime}</p>
                      <p className="font-semibold">{monthsToPayoff} {t.months}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t.timeRemaining}</p>
                      <p className="font-semibold text-primary">
                        {monthOffset > 0 ? `${timeRemaining} ${t.months}` : `${monthsToPayoff} ${t.months}`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t.payoffProgress}</span>
                      <span>{payoffProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={payoffProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
        <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-muted-foreground">
          {t.sortedBy}{" "}
          <span className="font-medium">
            {method === "avalanche" ? t.highestAPR : method === "snowball" ? t.smallestBalance : t.hybridScore}
          </span>{" "}
          - {t.payFirst}
        </p>
      </div>
    </div>
  );
};
