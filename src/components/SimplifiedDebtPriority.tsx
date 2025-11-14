import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/i18n";
import { AlertCircle, TrendingDown } from "lucide-react";

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
}

/**
 * SimplifiedDebtPriority Component
 * Clean card-based visualization of debt priority
 * Shows: Name, Balance, Monthly Payment, Priority Score (1-10)
 * Color-coded by priority: Green (low) to Red (high)
 */
export const SimplifiedDebtPriority = ({ debts, method }: SimplifiedDebtPriorityProps) => {
  if (debts.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No active debts to prioritize</p>
      </div>
    );
  }

  // Calculate priority scores (1-10 scale)
  const calculatePriorityScore = (debt: Debt): number => {
    const maxAPR = Math.max(...debts.map(d => d.apr));
    const maxBalance = Math.max(...debts.map(d => d.balance));
    
    if (method === "avalanche") {
      // Higher APR = higher priority
      return Math.round((debt.apr / maxAPR) * 10);
    } else if (method === "snowball") {
      // Lower balance = higher priority (inverted)
      return Math.round(((maxBalance - debt.balance) / maxBalance) * 10);
    } else {
      // Hybrid: combine APR and balance
      const aprScore = (debt.apr / maxAPR) * 5;
      const balanceScore = ((maxBalance - debt.balance) / maxBalance) * 5;
      return Math.round(aprScore + balanceScore);
    }
  };

  // Sort debts by priority
  const sortedDebts = [...debts].sort((a, b) => {
    const scoreA = calculatePriorityScore(a);
    const scoreB = calculatePriorityScore(b);
    return scoreB - scoreA; // Higher score first
  });

  // Calculate payoff progress for each debt
  const getPayoffProgress = (debt: Debt): number => {
    if (debt.minimum_payment === 0 || debt.balance === 0) return 0;
    const monthsToPayoff = debt.balance / debt.minimum_payment;
    // Progress inversely related to months (fewer months = more progress)
    // Cap at 100% to avoid over-100% values
    return Math.min(100, Math.max(0, (12 / monthsToPayoff) * 100));
  };

  // Get color based on priority score
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

  // Calculate totals
  const totalMonthlyDebt = debts.reduce((sum, d) => sum + d.minimum_payment, 0);
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
  const averageMonthsToPayoff = totalBalance / totalMonthlyDebt;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Monthly Debt</p>
              <p className="text-2xl font-bold">{formatCurrency(totalMonthlyDebt)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Debt Free in</p>
              <p className="text-2xl font-bold">{Math.ceil(averageMonthsToPayoff)} months</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debt Priority Cards */}
      <div className="space-y-3">
        {sortedDebts.map((debt, index) => {
          const priorityScore = calculatePriorityScore(debt);
          const payoffProgress = getPayoffProgress(debt);
          const monthsToPayoff = Math.ceil(debt.balance / debt.minimum_payment);

          return (
            <Card 
              key={debt.id} 
              className={`border-l-4 ${getPriorityColor(priorityScore)} shadow-sm hover:shadow-md transition-shadow`}
            >
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <h3 className="font-semibold text-lg">{debt.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        APR: {debt.apr.toFixed(2)}%
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(priorityScore)}`}>
                      Priority: {priorityScore}/10
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-semibold">{formatCurrency(debt.balance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Payment</p>
                      <p className="font-semibold">{formatCurrency(debt.minimum_payment)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payoff Time</p>
                      <p className="font-semibold">{monthsToPayoff} months</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Payoff Progress</span>
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

      {/* Strategy Info */}
      <div className="flex items-center gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
        <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-muted-foreground">
          Sorted by <span className="font-medium">
            {method === "avalanche" ? "highest APR" : method === "snowball" ? "smallest balance" : "hybrid score"}
          </span> - Pay the top priority debt first
        </p>
      </div>
    </div>
  );
};
