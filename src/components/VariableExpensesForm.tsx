import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShoppingCart, UtensilsCrossed, Fuel, ShoppingBag } from "lucide-react";
import { getTranslation, Language } from "@/lib/i18n";
import { variableExpenseSchema } from "@/components/validation/schemas";
import { toast } from "sonner";

export interface VariableExpensesFormProps {
  onExpensesChange: (groceries: number, dining: number, transport: number, shopping: number, entertainment: number) => void;
  language: Language;
}

export const VariableExpensesForm = ({ onExpensesChange, language }: VariableExpensesFormProps) => {
  const t = (key: string) => getTranslation(language, key);
  const [groceries, setGroceries] = useState<string>("");
  const [dining, setDining] = useState<string>("");
  const [transport, setTransport] = useState<string>("");
  const [shopping, setShopping] = useState<string>("");
  const [entertainment, setEntertainment] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expenses = {
      groceries: parseFloat(groceries) || 0,
      dining: parseFloat(dining) || 0,
      transport: parseFloat(transport) || 0,
      shopping: parseFloat(shopping) || 0,
      entertainment: parseFloat(entertainment) || 0,
    };

    // Validate each expense
    for (const [key, value] of Object.entries(expenses)) {
      const result = variableExpenseSchema.safeParse({ amount: value });
      if (!result.success) {
        toast.error(`${key}: ${result.error.errors[0].message}`);
        return;
      }
    }

    onExpensesChange(
      expenses.groceries,
      expenses.dining,
      expenses.transport,
      expenses.shopping,
      expenses.entertainment
    );
  };

  return (
    <Card className="shadow-medium border-muted">
      <CardHeader className="bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <CardTitle>{t('variableExpenses')}</CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Enter your estimated monthly spending' : 'Ingresa tus gastos variables estimados'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groceries" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Groceries & Food Shopping
            </Label>
            <Input
              id="groceries"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={groceries}
              onChange={(e) => setGroceries(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dining" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              Dining Out & Takeaways
            </Label>
            <Input
              id="dining"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={dining}
              onChange={(e) => setDining(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transport" className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-primary" />
              Transport & Petrol
            </Label>
            <Input
              id="transport"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopping" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Shopping & Personal Items
            </Label>
            <Input
              id="shopping"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={shopping}
              onChange={(e) => setShopping(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entertainment">
              Entertainment & Leisure
            </Label>
            <Input
              id="entertainment"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={entertainment}
              onChange={(e) => setEntertainment(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          <Button type="submit" className="w-full">
            {t('updateVariableExpenses')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
