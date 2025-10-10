import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCard, Car, Wallet, TrendingDown } from "lucide-react";

interface DebtsFormProps {
  onDebtsChange: (personalLoan: number, carFinance: number, creditCards: number) => void;
}

export const DebtsForm = ({ onDebtsChange }: DebtsFormProps) => {
  const [personalLoan, setPersonalLoan] = useState<string>("");
  const [carFinance, setCarFinance] = useState<string>("");
  const [creditCards, setCreditCards] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDebtsChange(
      parseFloat(personalLoan) || 0,
      parseFloat(carFinance) || 0,
      parseFloat(creditCards) || 0
    );
  };

  return (
    <Card className="shadow-medium border-debt/20">
      <CardHeader className="bg-gradient-debt text-debt-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          <CardTitle>Monthly Debts</CardTitle>
        </div>
        <CardDescription className="text-debt-foreground/80">
          Enter your monthly debt payments
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personalLoan" className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-debt" />
              Personal Loan
            </Label>
            <Input
              id="personalLoan"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={personalLoan}
              onChange={(e) => setPersonalLoan(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carFinance" className="flex items-center gap-2">
              <Car className="h-4 w-4 text-debt" />
              Car Finance
            </Label>
            <Input
              id="carFinance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={carFinance}
              onChange={(e) => setCarFinance(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="creditCards" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-debt" />
              Credit Cards
            </Label>
            <Input
              id="creditCards"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={creditCards}
              onChange={(e) => setCreditCards(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <Button type="submit" className="w-full bg-debt hover:bg-debt/90">
            Update Debts
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
