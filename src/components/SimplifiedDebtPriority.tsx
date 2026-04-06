import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, Language } from "@/lib/i18n";
import { AlertCircle, TrendingDown, ChevronDown, ChevronUp, Zap, Target, Clock, ArrowRight } from "lucide-react";
import { useDebtPayments } from "@/hooks/useDebtPayments";
import { Button } from "@/components/ui/button";

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
  cashFlow?: number;
  monthlySavings?: number;
}

interface SimulationResult {
  debtId: string;
  name: string;
  apr: number;
  currentBalance: number;
  originalBalance: number;
  minimumPayment: number;
  extraPayment: number;
  totalMonthlyPayment: number;
  monthsMinOnly: number;
  monthsWithExtra: number;
  interestMinOnly: number;
  interestWithExtra: number;
  interestSaved: number;
  monthsSaved: number;
  progressPercent: number;
  priorityRank: number;
  monthlyProjection: { month: number; balance: number }[];
}

function runAmortization(
  debts: { id: string; name: string; balance: number; minPay: number; apr: number }[],
  extraBudget: number,
  method: "avalanche" | "snowball" | "hybrid",
  maxMonths = 360
): { perDebt: Map<string, { months: number; interest: number; projection: { month: number; balance: number }[] }>; totalMonths: number } {
  const simDebts = debts.map(d => ({
    ...d,
    bal: d.balance,
    totalInterest: 0,
    months: 0,
    done: false,
    projection: [{ month: 0, balance: d.balance }],
  }));

  let month = 0;
  while (simDebts.some(d => !d.done) && month < maxMonths) {
    month++;

    // 1. Apply interest
    for (const d of simDebts) {
      if (d.done) continue;
      const interest = d.bal * (d.apr / 100 / 12);
      d.totalInterest += interest;
      d.bal += interest;
    }

    // 2. Apply minimum payments
    for (const d of simDebts) {
      if (d.done) continue;
      const pay = Math.min(d.minPay, d.bal);
      d.bal -= pay;
      if (d.bal < 0.01) { d.bal = 0; d.done = true; d.months = month; }
    }

    // 3. Freed-up minimums from paid-off debts + extra budget
    let availableExtra = extraBudget;
    for (const d of simDebts) {
      if (d.done && d.months === month) {
        // This debt just got paid off this month - its minimum is now freed
      } else if (d.done) {
        availableExtra += d.minPay;
      }
    }

    // 4. Sort remaining debts by strategy and apply extra
    const active = simDebts.filter(d => !d.done);
    if (method === "avalanche") {
      active.sort((a, b) => b.apr - a.apr);
    } else if (method === "snowball") {
      active.sort((a, b) => a.bal - b.bal);
    } else {
      active.sort((a, b) => {
        const maxApr = Math.max(...simDebts.map(x => x.apr)) || 1;
        const maxBal = Math.max(...simDebts.map(x => x.balance)) || 1;
        const scoreA = (a.apr / maxApr) * 0.6 + ((maxBal - a.bal) / maxBal) * 0.4;
        const scoreB = (b.apr / maxApr) * 0.6 + ((maxBal - b.bal) / maxBal) * 0.4;
        return scoreB - scoreA;
      });
    }

    for (const d of active) {
      if (availableExtra <= 0) break;
      const pay = Math.min(availableExtra, d.bal);
      d.bal -= pay;
      availableExtra -= pay;
      if (d.bal < 0.01) { d.bal = 0; d.done = true; d.months = month; }
    }

    // Record projection
    for (const d of simDebts) {
      d.projection.push({ month, balance: d.bal });
    }
  }

  // Any still not done
  for (const d of simDebts) {
    if (!d.done) d.months = maxMonths;
  }

  const result = new Map<string, { months: number; interest: number; projection: { month: number; balance: number }[] }>();
  for (const d of simDebts) {
    result.set(d.id, { months: d.months, interest: d.totalInterest, projection: d.projection });
  }
  const totalMonths = Math.max(...simDebts.map(d => d.months));
  return { perDebt: result, totalMonths };
}

export const SimplifiedDebtPriority = ({
  debts,
  method,
  language = "en",
  cashFlow = 0,
  monthlySavings = 0,
}: SimplifiedDebtPriorityProps) => {
  const { data: payments = [] } = useDebtPayments();
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);

  const surplus = Math.max(0, cashFlow);

  const simulation = useMemo<SimulationResult[]>(() => {
    if (debts.length === 0) return [];

    const debtInputs = debts.map(d => ({
      id: d.id,
      name: d.name,
      balance: d.balance,
      minPay: d.minimum_payment,
      apr: d.apr,
    }));

    // Run with minimum payments only
    const minOnly = runAmortization(debtInputs, 0, method);
    // Run with surplus as extra
    const withExtra = runAmortization(debtInputs, surplus, method);

    // Sort by strategy
    const sortFn =
      method === "avalanche"
        ? (a: Debt, b: Debt) => b.apr - a.apr
        : method === "snowball"
          ? (a: Debt, b: Debt) => a.balance - b.balance
          : (a: Debt, b: Debt) => {
              const maxApr = Math.max(...debts.map(x => x.apr)) || 1;
              const maxBal = Math.max(...debts.map(x => x.balance)) || 1;
              const scoreA = (a.apr / maxApr) * 0.6 + ((maxBal - a.balance) / maxBal) * 0.4;
              const scoreB = (b.apr / maxApr) * 0.6 + ((maxBal - b.balance) / maxBal) * 0.4;
              return scoreB - scoreA;
            };

    const sorted = [...debts].sort(sortFn);

    // Calculate how extra is distributed in month 1
    let extraRemaining = surplus;
    const extraAllocation = new Map<string, number>();
    for (const d of sorted) {
      extraAllocation.set(d.id, 0);
    }
    for (const d of sorted) {
      if (extraRemaining <= 0) break;
      const extraForThis = Math.min(extraRemaining, d.balance);
      extraAllocation.set(d.id, extraForThis);
      extraRemaining -= extraForThis;
    }

    return sorted.map((debt, index) => {
      const totalPaid = payments
        .filter(p => p.debt_id === debt.id)
        .reduce((sum, p) => sum + p.amount, 0);

      const minData = minOnly.perDebt.get(debt.id)!;
      const extraData = withExtra.perDebt.get(debt.id)!;
      const originalBalance = debt.balance + totalPaid;

      return {
        debtId: debt.id,
        name: debt.name,
        apr: debt.apr,
        currentBalance: debt.balance,
        originalBalance,
        minimumPayment: debt.minimum_payment,
        extraPayment: extraAllocation.get(debt.id) || 0,
        totalMonthlyPayment: debt.minimum_payment + (extraAllocation.get(debt.id) || 0),
        monthsMinOnly: minData.months,
        monthsWithExtra: extraData.months,
        interestMinOnly: Math.round(minData.interest),
        interestWithExtra: Math.round(extraData.interest),
        interestSaved: Math.round(minData.interest - extraData.interest),
        monthsSaved: minData.months - extraData.months,
        progressPercent: originalBalance > 0 ? Math.min(100, (totalPaid / originalBalance) * 100) : 0,
        priorityRank: index + 1,
        monthlyProjection: extraData.projection.slice(0, Math.min(extraData.months + 1, 25)),
      };
    });
  }, [debts, payments, method, surplus]);

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
      totalMinPayments: "Total Min. Payments",
      surplus: "Monthly Surplus",
      totalMonthly: "Total Monthly",
      debtFreeIn: "Debt Free in",
      debtFreeMinOnly: "Min. Only",
      debtFreeWithExtra: "With Extra",
      months: "months",
      balance: "Current Balance",
      minPayment: "Min. Payment",
      extraPayment: "Extra Payment",
      totalPayment: "Total Payment",
      payoffMinOnly: "Payoff (Min. Only)",
      payoffWithExtra: "Payoff (With Extra)",
      interestSaved: "Interest Saved",
      monthsSaved: "Months Saved",
      progress: "Payment Progress",
      projection: "Balance Projection",
      sortedBy: "Sorted by",
      highestAPR: "highest APR",
      smallestBalance: "smallest balance",
      hybridScore: "hybrid score",
      extraGoesHere: "Extra surplus goes here first",
      noSurplus: "No surplus available — only minimum payments applied",
      hasSurplus: "surplus available for extra debt payments",
      showDetails: "Show details",
      hideDetails: "Hide details",
      totalInterest: "Total Interest",
      vs: "vs",
    },
    es: {
      totalMinPayments: "Pagos Mín. Totales",
      surplus: "Excedente Mensual",
      totalMonthly: "Total Mensual",
      debtFreeIn: "Libre de deuda en",
      debtFreeMinOnly: "Solo Mínimos",
      debtFreeWithExtra: "Con Extra",
      months: "meses",
      balance: "Saldo Actual",
      minPayment: "Pago Mínimo",
      extraPayment: "Pago Extra",
      totalPayment: "Pago Total",
      payoffMinOnly: "Liquidación (Solo Mín.)",
      payoffWithExtra: "Liquidación (Con Extra)",
      interestSaved: "Interés Ahorrado",
      monthsSaved: "Meses Ahorrados",
      progress: "Progreso de Pago",
      projection: "Proyección de Saldo",
      sortedBy: "Ordenado por",
      highestAPR: "mayor APR",
      smallestBalance: "menor saldo",
      hybridScore: "puntuación híbrida",
      extraGoesHere: "El excedente va aquí primero",
      noSurplus: "Sin excedente — solo se aplican pagos mínimos",
      hasSurplus: "excedente disponible para pagos extra",
      showDetails: "Ver detalles",
      hideDetails: "Ocultar detalles",
      totalInterest: "Interés Total",
      vs: "vs",
    },
    pt: {
      totalMinPayments: "Pagamentos Mín. Totais",
      surplus: "Excedente Mensal",
      totalMonthly: "Total Mensal",
      debtFreeIn: "Livre de dívida em",
      debtFreeMinOnly: "Só Mínimos",
      debtFreeWithExtra: "Com Extra",
      months: "meses",
      balance: "Saldo Atual",
      minPayment: "Pagamento Mínimo",
      extraPayment: "Pagamento Extra",
      totalPayment: "Pagamento Total",
      payoffMinOnly: "Quitação (Só Mín.)",
      payoffWithExtra: "Quitação (Com Extra)",
      interestSaved: "Juros Economizados",
      monthsSaved: "Meses Economizados",
      progress: "Progresso de Pagamento",
      projection: "Projeção de Saldo",
      sortedBy: "Ordenado por",
      highestAPR: "maior APR",
      smallestBalance: "menor saldo",
      hybridScore: "pontuação híbrida",
      extraGoesHere: "O excedente vai aqui primeiro",
      noSurplus: "Sem excedente — apenas pagamentos mínimos aplicados",
      hasSurplus: "excedente disponível para pagamentos extra",
      showDetails: "Ver detalhes",
      hideDetails: "Ocultar detalhes",
      totalInterest: "Juros Totais",
      vs: "vs",
    },
  }[language];

  const totalMinPayments = debts.reduce((s, d) => s + d.minimum_payment, 0);
  const totalMonthly = totalMinPayments + surplus;

  const minOnlyMonths = Math.max(...simulation.map(s => s.monthsMinOnly));
  const withExtraMonths = Math.max(...simulation.map(s => s.monthsWithExtra));
  const totalInterestSaved = simulation.reduce((s, d) => s + d.interestSaved, 0);

  const getPriorityColor = (rank: number, total: number): string => {
    if (rank === 1) return "border-red-500 dark:border-red-400";
    if (rank <= Math.ceil(total / 2)) return "border-orange-500 dark:border-orange-400";
    return "border-green-500 dark:border-green-400";
  };

  const getPriorityBadgeColor = (rank: number, total: number): string => {
    if (rank === 1) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    if (rank <= Math.ceil(total / 2)) return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t.totalMinPayments}</p>
              <p className="text-xl font-bold">{formatCurrency(totalMinPayments)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.surplus}</p>
              <p className={`text-xl font-bold ${surplus > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                {surplus > 0 ? `+${formatCurrency(surplus)}` : formatCurrency(0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.debtFreeMinOnly}</p>
              <p className="text-xl font-bold text-muted-foreground">{minOnlyMonths} {t.months}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.debtFreeWithExtra}</p>
              <p className="text-xl font-bold text-primary">
                {withExtraMonths} {t.months}
                {surplus > 0 && withExtraMonths < minOnlyMonths && (
                  <span className="text-xs ml-1 text-emerald-600 dark:text-emerald-400">
                    (-{minOnlyMonths - withExtraMonths})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Surplus indicator */}
          {surplus > 0 ? (
            <div className="mt-4 flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                <span className="font-semibold">{formatCurrency(surplus)}</span> {t.hasSurplus}
                {totalInterestSaved > 0 && (
                  <span className="ml-2">
                    — {t.interestSaved}: <span className="font-semibold">{formatCurrency(totalInterestSaved)}</span>
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">{t.noSurplus}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debt cards */}
      <div className="space-y-3">
        {simulation.map((debt) => {
          const isExpanded = expandedDebt === debt.debtId;
          const isTopPriority = debt.priorityRank === 1 && surplus > 0;

          return (
            <Card
              key={debt.debtId}
              className={`border-l-4 ${getPriorityColor(debt.priorityRank, simulation.length)} shadow-sm hover:shadow-md transition-shadow ${isTopPriority ? "ring-1 ring-primary/20" : ""}`}
            >
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">#{debt.priorityRank}</span>
                        <h3 className="font-semibold text-lg">{debt.name}</h3>
                        {isTopPriority && (
                          <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            <Target className="h-3 w-3" /> {t.extraGoesHere}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">APR: {debt.apr.toFixed(2)}%</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(debt.priorityRank, simulation.length)}`}>
                      #{debt.priorityRank}
                    </div>
                  </div>

                  {/* Key metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">{t.balance}</p>
                      <p className="font-semibold">{formatCurrency(debt.currentBalance)}</p>
                    </div>
                    <div className="p-2 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">{t.minPayment}</p>
                      <p className="font-semibold">{formatCurrency(debt.minimumPayment)}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${debt.extraPayment > 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-secondary/50"}`}>
                      <p className="text-xs text-muted-foreground">{t.extraPayment}</p>
                      <p className={`font-semibold ${debt.extraPayment > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                        {debt.extraPayment > 0 ? `+${formatCurrency(debt.extraPayment)}` : formatCurrency(0)}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${debt.extraPayment > 0 ? "bg-primary/5" : "bg-secondary/50"}`}>
                      <p className="text-xs text-muted-foreground">{t.totalPayment}</p>
                      <p className="font-semibold text-primary">{formatCurrency(debt.totalMonthlyPayment)}</p>
                    </div>
                  </div>

                  {/* Payoff comparison */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground line-through">{debt.monthsMinOnly} {t.months}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold text-primary">{debt.monthsWithExtra} {t.months}</span>
                    {debt.monthsSaved > 0 && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        (-{debt.monthsSaved})
                      </span>
                    )}
                    {debt.interestSaved > 0 && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-auto">
                        {t.interestSaved}: {formatCurrency(debt.interestSaved)}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t.progress}</span>
                      <span>{debt.progressPercent.toFixed(0)}%</span>
                    </div>
                    <Progress value={debt.progressPercent} className="h-2" />
                  </div>

                  {/* Expandable details */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setExpandedDebt(isExpanded ? null : debt.debtId)}
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                    {isExpanded ? t.hideDetails : t.showDetails}
                  </Button>

                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t">
                      {/* Projection mini chart using bars */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">{t.projection}</p>
                        <div className="flex items-end gap-0.5 h-16">
                          {debt.monthlyProjection.map((point, i) => {
                            const maxBal = debt.monthlyProjection[0]?.balance || 1;
                            const height = maxBal > 0 ? (point.balance / maxBal) * 100 : 0;
                            return (
                              <div
                                key={i}
                                className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-colors relative group"
                                style={{ height: `${Math.max(1, height)}%` }}
                              >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover border rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap z-10 shadow-sm">
                                  M{point.month}: {formatCurrency(point.balance)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>M0</span>
                          <span>M{debt.monthlyProjection[debt.monthlyProjection.length - 1]?.month || 0}</span>
                        </div>
                      </div>

                      {/* Detailed comparison */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">{t.payoffMinOnly}</p>
                          <p className="font-medium">{debt.monthsMinOnly} {t.months}</p>
                          <p className="text-xs text-muted-foreground">{t.totalInterest}: {formatCurrency(debt.interestMinOnly)}</p>
                        </div>
                        <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="text-xs text-muted-foreground">{t.payoffWithExtra}</p>
                          <p className="font-semibold text-primary">{debt.monthsWithExtra} {t.months}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">{t.totalInterest}: {formatCurrency(debt.interestWithExtra)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
        <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-muted-foreground">
          {t.sortedBy}{" "}
          <span className="font-medium">
            {method === "avalanche" ? t.highestAPR : method === "snowball" ? t.smallestBalance : t.hybridScore}
          </span>
        </p>
      </div>
    </div>
  );
};
