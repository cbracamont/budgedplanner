import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp } from "lucide-react";

interface IncomeFormProps {
  onIncomeChange: (salary: number, tips: number) => void;
}

export const IncomeForm = ({ onIncomeChange }: IncomeFormProps) => {
  const [salary, setSalary] = useState<string>("");
  const [tips, setTips] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onIncomeChange(
      parseFloat(salary) || 0,
      parseFloat(tips) || 0
    );
  };

  return (
    <Card className="shadow-medium border-income/20">
      <CardHeader className="bg-gradient-income text-income-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <CardTitle>Monthly Income</CardTitle>
        </div>
        <CardDescription className="text-income-foreground/80">
          Enter your income sources
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-income" />
              Monthly Salary
            </Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tips" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-income" />
              Monthly Tips
            </Label>
            <Input
              id="tips"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <Button type="submit" className="w-full bg-income hover:bg-income/90">
            Update Income
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
