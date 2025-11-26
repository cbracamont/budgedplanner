import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/i18n";
import { useAddDebtPayment } from "@/hooks/useDebtPayments";
import { format } from "date-fns";
interface Debt {
  id: string;
  name: string;
  apr: number;
  balance: number;
  minimum_payment: number;
}
interface MonthlyPaymentProposalProps {
  cashFlow: number;
  monthlySavings: number;
  totalFixed: number;
  totalVariable: number;
  debts: Debt[];
}

/**
 * MonthlyPaymentProposal Component
 * Generates smart allocation proposal based on surplus funds
 * Allocates: 50% to highest APR debt, 30% to emergency fund, 20% to variable expenses
 */
export const MonthlyPaymentProposal = ({
  cashFlow,
  monthlySavings,
  totalFixed,
  totalVariable,
  debts
}: MonthlyPaymentProposalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    toast
  } = useToast();
  const addPaymentMutation = useAddDebtPayment();

  // Calculate surplus
  const surplus = Math.max(0, cashFlow - monthlySavings);

  // Get highest APR debt
  const highestAPRDebt = debts.length > 0 ? debts.reduce((prev, current) => prev.apr > current.apr ? prev : current) : null;

  // Calculate allocations
  const debtAllocation = surplus * 0.5;
  const emergencyAllocation = surplus * 0.3;
  const variableAllocation = surplus * 0.2;
  const proposals = [{
    category: "Highest APR Debt",
    name: highestAPRDebt?.name || "No debts",
    amount: debtAllocation,
    description: `Pay extra ${formatCurrency(debtAllocation)} to ${highestAPRDebt?.name || 'debt'}`,
    canApply: !!highestAPRDebt,
    debtId: highestAPRDebt?.id
  }, {
    category: "Emergency Fund",
    name: "Emergency Savings",
    amount: emergencyAllocation,
    description: `Add ${formatCurrency(emergencyAllocation)} to emergency fund`,
    canApply: true
  }, {
    category: "Variable Expenses Buffer",
    name: "Variable Expenses",
    amount: variableAllocation,
    description: `Reserve ${formatCurrency(variableAllocation)} for variable expenses`,
    canApply: true
  }];
  const handleApplyProposal = async (proposal: typeof proposals[0]) => {
    if (!proposal.canApply) return;
    try {
      if (proposal.debtId) {
        // Add payment to debt tracker
        await addPaymentMutation.mutateAsync({
          debt_id: proposal.debtId,
          amount: proposal.amount,
          payment_date: format(new Date(), 'yyyy-MM-dd'),
          notes: `Auto-allocated from monthly proposal - ${proposal.description}`
        });
        toast({
          title: "Proposal Applied",
          description: `${formatCurrency(proposal.amount)} added to ${proposal.name} - Check Monthly Payment Tracker`
        });
      } else {
        // For emergency fund and variable expenses, just show confirmation
        toast({
          title: "Proposal Noted",
          description: proposal.description
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply proposal. Please try manually.",
        variant: "destructive"
      });
    }
  };
  if (surplus <= 0) {
    return null; // Don't show button if no surplus
  }
  return <>
      

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Smart Monthly Payment Proposal</DialogTitle>
            <DialogDescription>
              Based on your surplus of {formatCurrency(surplus)}, here's a recommended allocation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Surplus Calculation:</p>
              <p className="text-lg font-semibold">
                Cash Flow ({formatCurrency(cashFlow)}) - Monthly Savings ({formatCurrency(monthlySavings)}) = {formatCurrency(surplus)}
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Suggested Amount</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal, index) => <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{proposal.category}</p>
                        <p className="text-sm text-muted-foreground">{proposal.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(proposal.amount)}
                      <p className="text-xs text-muted-foreground">
                        {Math.round(proposal.amount / surplus * 100)}% of surplus
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleApplyProposal(proposal)} disabled={!proposal.canApply}>
                        Apply
                      </Button>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>

            <div className="text-sm text-muted-foreground space-y-1 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg">
              <p className="font-medium">Allocation Strategy:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>50% to highest APR debt (accelerates debt payoff)</li>
                <li>30% to emergency fund (builds financial security)</li>
                <li>20% to variable expenses buffer (provides flexibility)</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};