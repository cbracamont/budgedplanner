import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Home, Zap, Wifi, Phone } from "lucide-react";
import { getTranslation, Language } from "@/lib/i18n";
import { fixedExpenseSchema } from "@/components/validation/schemas";
import { toast } from "sonner";

export interface FixedExpensesFormProps {
  onExpensesChange: (rent: number, utilities: number, internet: number, phone: number, other: number) => void;
  language: Language;
}

export const FixedExpensesForm = ({ onExpensesChange, language }: FixedExpensesFormProps) => {
  const t = (key: string) => getTranslation(language, key);
  const [rent, setRent] = useState<string>("");
  const [utilities, setUtilities] = useState<string>("");
  const [internet, setInternet] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [other, setOther] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expenses = {
      rent: parseFloat(rent) || 0,
      utilities: parseFloat(utilities) || 0,
      internet: parseFloat(internet) || 0,
      phone: parseFloat(phone) || 0,
      other: parseFloat(other) || 0,
    };

    // Validate each expense
    for (const [key, value] of Object.entries(expenses)) {
      const result = fixedExpenseSchema.safeParse({ amount: value });
      if (!result.success) {
        toast.error(`${key}: ${result.error.errors[0].message}`);
        return;
      }
    }

    onExpensesChange(expenses.rent, expenses.utilities, expenses.internet, expenses.phone, expenses.other);
  };

  return (
    <Card className="shadow-medium border-warning/20">
      <CardHeader className="bg-warning/10 border-b border-warning/20">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-warning" />
          <CardTitle>{t('fixedExpenses')}</CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Enter your regular monthly expenses' : 'Ingresa tus gastos fijos mensuales'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rent" className="flex items-center gap-2">
              <Home className="h-4 w-4 text-warning" />
              Rent/Mortgage
            </Label>
            <Input
              id="rent"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="utilities" className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              Utilities (Gas, Electric, Water)
            </Label>
            <Input
              id="utilities"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={utilities}
              onChange={(e) => setUtilities(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internet" className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-warning" />
              Internet & TV
            </Label>
            <Input
              id="internet"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={internet}
              onChange={(e) => setInternet(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-warning" />
              Mobile Phone
            </Label>
            <Input
              id="phone"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="other">
              Other Fixed Expenses
            </Label>
            <Input
              id="other"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={other}
              onChange={(e) => setOther(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <Button type="submit" className="w-full">
            {t('updateFixedExpenses')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
