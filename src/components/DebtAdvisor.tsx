import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency, getTranslation, Language } from "@/lib/i18n";

interface Debt {
  name: string;
  balance: number;
  apr: number;
  minimumPayment: number;
}

interface DebtAdvisorProps {
  debts: Debt[];
  extraPayment: number;
  language: Language;
}

export const DebtAdvisor = ({ debts, extraPayment, language }: DebtAdvisorProps) => {
  const t = (key: string) => getTranslation(language, key);

  const calculateDebtFreeDate = () => {
    if (debts.length === 0 || extraPayment <= 0) return null;
    
    const totalMonthlyPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0) + extraPayment;
    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    
    // Simplified calculation (doesn't account for compound interest)
    const monthsToPayOff = Math.ceil(totalBalance / totalMonthlyPayment);
    const debtFreeDate = new Date();
    debtFreeDate.setMonth(debtFreeDate.getMonth() + monthsToPayOff);
    
    return debtFreeDate;
  };

  const prioritizeDebts = () => {
    // Sort by APR (highest first) - Avalanche method
    return [...debts].sort((a, b) => b.apr - a.apr);
  };

  const calculateInterestSavings = () => {
    if (extraPayment <= 0 || debts.length === 0) return 0;
    
    // Simplified interest savings calculation
    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const avgAPR = debts.reduce((sum, d) => sum + d.apr, 0) / debts.length;
    
    const monthsWithoutExtra = Math.ceil(totalBalance / debts.reduce((sum, d) => sum + d.minimumPayment, 0));
    const monthsWithExtra = Math.ceil(totalBalance / (debts.reduce((sum, d) => sum + d.minimumPayment, 0) + extraPayment));
    
    const monthsSaved = monthsWithoutExtra - monthsWithExtra;
    const interestSaved = (totalBalance * (avgAPR / 100) / 12) * monthsSaved;
    
    return Math.max(0, interestSaved);
  };

  const debtFreeDate = calculateDebtFreeDate();
  const prioritizedDebts = prioritizeDebts();
  const interestSavings = calculateInterestSavings();

  return (
    <Card className="shadow-medium border-primary/20">
      <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          <CardTitle>{t('debtAdvisorTitle')}</CardTitle>
        </div>
        <CardDescription className="text-primary-foreground/80">
          {t('debtAdvisorDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {debtFreeDate && (
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{t('debtFreeDate')}</p>
                <p className="text-2xl font-bold text-success">
                  {debtFreeDate.toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {prioritizedDebts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">{t('payoffOrder')}</h3>
            </div>
            <div className="space-y-2">
              {prioritizedDebts.map((debt, index) => (
                <div 
                  key={index}
                  className="p-3 bg-secondary rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {index + 1}. {debt.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        APR: {debt.apr}% • {formatCurrency(debt.balance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-debt">
                        {formatCurrency(debt.minimumPayment)}/mo
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {interestSavings > 0 && (
          <div className="p-4 bg-income/10 rounded-lg border border-income/20">
            <p className="text-sm text-muted-foreground mb-1">{t('potentialSavings')}</p>
            <p className="text-2xl font-bold text-income">
              {formatCurrency(interestSavings)}
            </p>
          </div>
        )}

        {debts.length === 0 && (
          <div className="p-4 bg-success/10 rounded-lg">
            <p className="text-sm text-success font-medium">
              {t('noDebts')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
