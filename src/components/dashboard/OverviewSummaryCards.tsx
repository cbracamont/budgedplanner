import { PiggyBank } from "lucide-react";
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
      emoji: "🚀",
      label: "Excellent",
      color: "text-emerald-600",
      progress: 95,
      message: `Amazing! You're saving ${formatCurrency(cashFlow)} per month — 30%+ of expenses. Keep going!`,
    };
  if (cashFlow > totalExpenses * 0.1)
    return {
      emoji: "💪",
      label: "Strong",
      color: "text-green-600",
      progress: 80,
      message: `Great job! You have ${formatCurrency(cashFlow)} per month in disposable income — 10-30% of expenses. Solid foundation.`,
    };
  if (cashFlow > 0)
    return {
      emoji: "✅",
      label: "Healthy",
      color: "text-blue-600",
      progress: 65,
      message: `You're in the green! Saving ${formatCurrency(cashFlow)} per month. Small wins add up.`,
    };
  if (cashFlow > -totalExpenses * 0.1)
    return {
      emoji: "⚠️",
      label: "Review",
      color: "text-orange-600",
      progress: 40,
      message: `Close call! You're overspending by ${formatCurrency(Math.abs(cashFlow))} — less than 10% of expenses. Trim a little.`,
    };
  return {
    emoji: "🔴",
    label: "Critical",
    color: "text-red-600",
    progress: 20,
    message: `Alert! Overspending by ${formatCurrency(Math.abs(cashFlow))} — over 10% of expenses. Cut now to avoid debt.`,
  };
};

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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">{labels.totalIncome}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            {totalVariableIncome > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {labels.variable}: {formatCurrency(totalVariableIncome)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">{labels.totalExpenses}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card className={cashFlow >= 0 ? "border-emerald-200" : "border-orange-200"}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm ${cashFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
              {labels.cashFlow}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${cashFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
              {formatCurrency(cashFlow)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-600 flex items-center gap-1">
              <PiggyBank className="h-4 w-4" /> {labels.totalSavings}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{formatCurrency(savingsTotal)}</div>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
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

      <div className="text-center py-8">
        <div className={`text-7xl font-bold ${status.color} animate-scale-in`}>
          {status.emoji} {status.label}
        </div>
        <Progress value={status.progress} className="mt-6 h-3" />
        <p className="mt-4 text-muted-foreground">{status.message}</p>
      </div>
    </>
  );
};
