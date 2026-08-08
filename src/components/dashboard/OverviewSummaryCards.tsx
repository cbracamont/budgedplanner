import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  PiggyBank,
  Rocket,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/i18n";

interface OverviewSummaryCardsProps {
  totalIncome: number;
  totalVariableIncome: number;
  totalExpenses: number;
  cashFlow: number;
  savingsTotal: number;
  emergencyFund: number;
  generalSavings: number;
  goalsSaved: number;
  labels: {
    totalIncome: string;
    totalExpenses: string;
    cashFlow: string;
    totalSavings: string;
    variable: string;
    emergency: string;
    general: string;
    goals: string;
  };
}

const statusFor = (cashFlow: number, totalExpenses: number) => {
  if (cashFlow > totalExpenses * 0.3)
    return {
      Icon: Rocket,
      label: "Excellent",
      tone: "text-success",
      progress: 95,
      message: `Amazing! You're saving ${formatCurrency(cashFlow)} per month — 30%+ of expenses. Keep going!`,
    };
  if (cashFlow > totalExpenses * 0.1)
    return {
      Icon: TrendingUp,
      label: "Strong",
      tone: "text-success",
      progress: 80,
      message: `Great job! You have ${formatCurrency(cashFlow)} per month in disposable income — 10-30% of expenses. Solid foundation.`,
    };
  if (cashFlow > 0)
    return {
      Icon: ShieldCheck,
      label: "Healthy",
      tone: "text-success",
      progress: 65,
      message: `You're in the green! Saving ${formatCurrency(cashFlow)} per month. Small wins add up.`,
    };
  if (cashFlow > -totalExpenses * 0.1)
    return {
      Icon: TrendingDown,
      label: "Review",
      tone: "text-warning",
      progress: 40,
      message: `Close call! You're overspending by ${formatCurrency(Math.abs(cashFlow))} — less than 10% of expenses. Trim a little.`,
    };
  return {
    Icon: TrendingDown,
    label: "Critical",
    tone: "text-destructive",
    progress: 20,
    message: `Alert! Overspending by ${formatCurrency(Math.abs(cashFlow))} — over 10% of expenses. Cut now to avoid debt.`,
  };
};

const metricCardClass =
  "animate-fade-in transition-shadow duration-200 hover:shadow-medium";

export const OverviewSummaryCards = ({
  totalIncome,
  totalVariableIncome,
  totalExpenses,
  cashFlow,
  savingsTotal,
  emergencyFund,
  generalSavings,
  goalsSaved,
  labels,
}: OverviewSummaryCardsProps) => {
  const status = statusFor(cashFlow, totalExpenses);
  const positive = cashFlow >= 0;
  const CashIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={metricCardClass} style={{ animationDelay: "0ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-label flex items-center gap-2 text-muted-foreground">
              <ArrowUpRight className="h-4 w-4 text-success" aria-hidden="true" />
              {labels.totalIncome}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-metric text-success">{formatCurrency(totalIncome)}</div>
            {totalVariableIncome > 0 && (
              <p className="text-label text-muted-foreground mt-1">
                {labels.variable}: {formatCurrency(totalVariableIncome)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={metricCardClass} style={{ animationDelay: "60ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-label flex items-center gap-2 text-muted-foreground">
              <ArrowDownRight className="h-4 w-4 text-destructive" aria-hidden="true" />
              {labels.totalExpenses}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-metric text-destructive">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card className={metricCardClass} style={{ animationDelay: "120ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-label flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" aria-hidden="true" />
              {labels.cashFlow}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-metric flex items-center gap-1 ${positive ? "text-success" : "text-destructive"}`}
            >
              <CashIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {formatCurrency(cashFlow)}
            </div>
          </CardContent>
        </Card>

        <Card className={metricCardClass} style={{ animationDelay: "180ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-label flex items-center gap-2 text-muted-foreground">
              <PiggyBank className="h-4 w-4 text-primary" aria-hidden="true" /> {labels.totalSavings}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-metric text-foreground">{formatCurrency(savingsTotal)}</div>
            <div className="text-label text-muted-foreground mt-1 space-y-0.5">
              <p>
                {labels.emergency}: {formatCurrency(emergencyFund)}
              </p>
              <p>
                {labels.general}: {formatCurrency(generalSavings)}
              </p>
              <p>
                {labels.goals}: {formatCurrency(goalsSaved)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-in" style={{ animationDelay: "240ms" }}>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${status.tone}`}>
              <status.Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-label text-muted-foreground">{labels.cashFlow}</p>
              <p className={`text-subtitle ${status.tone}`}>{status.label}</p>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <Progress
              value={status.progress}
              className="h-2"
              aria-label={`${labels.cashFlow}: ${status.label}`}
            />
            <p className="text-body-sm text-muted-foreground flex items-center gap-1">
              <Minus className="hidden" aria-hidden="true" />
              {status.message}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
