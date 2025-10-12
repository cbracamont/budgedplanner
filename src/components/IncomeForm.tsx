import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp } from "lucide-react";
import { getTranslation, Language } from "@/lib/i18n";

interface IncomeFormProps {
  onIncomeChange: (salary: number, tips: number) => void;
  language: Language;
}

export const IncomeForm = ({ onIncomeChange, language }: IncomeFormProps) => {
  const t = (key: string) => getTranslation(language, key);
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
      <CardHeader className="bg-income/10 border-b border-income/20">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-income" />
          <CardTitle>{t('income')}</CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Enter your monthly income sources' : 'Ingresa tus fuentes de ingreso mensuales'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary" className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-income" />
              {t('salary')}
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
            <Label htmlFor="tips">
              {t('tips')}
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

          <Button type="submit" className="w-full">
            {t('updateIncome')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
