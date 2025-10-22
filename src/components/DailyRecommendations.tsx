import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/i18n";

interface DailyRecommendationsProps {
  language: Language;
  totalIncome: number;
  totalDebts: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalSavings: number;
  debts: any[];
  emergencyFund: number;
  emergencyFundTarget: number;
}

export const DailyRecommendations = ({
  language,
  totalIncome,
  totalDebts,
  totalFixedExpenses,
  totalVariableExpenses,
  totalSavings,
  debts,
  emergencyFund,
  emergencyFundTarget
}: DailyRecommendationsProps) => {
  const [currentRecommendation, setCurrentRecommendation] = useState(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    generateRecommendations();
  }, [totalIncome, totalDebts, totalFixedExpenses, totalVariableExpenses, totalSavings, debts]);

  const generateRecommendations = () => {
    const recs: string[] = [];
    const availableBalance = totalIncome - totalDebts - totalFixedExpenses - totalVariableExpenses;
    const totalExpenses = totalFixedExpenses + totalVariableExpenses;

    // Debt-related recommendations
    if (debts.length > 0) {
      const highestAPRDebt = debts.reduce((prev, curr) => prev.apr > curr.apr ? prev : curr);
      const debtsNearPayoff = debts.filter(d => {
        const monthsRemaining = d.balance / (d.minimumPayment || 1);
        return monthsRemaining <= 3;
      });

      if (debtsNearPayoff.length > 0) {
        recs.push(
          language === 'en'
            ? `You're ${Math.ceil(debtsNearPayoff[0].balance / (debtsNearPayoff[0].minimumPayment || 1))} payments away from clearing ${debtsNearPayoff[0].name}. Keep it up!`
            : `Estás a ${Math.ceil(debtsNearPayoff[0].balance / (debtsNearPayoff[0].minimumPayment || 1))} pagos de terminar ${debtsNearPayoff[0].name}. ¡Sigue así!`
        );
      }

      if (availableBalance >= 50) {
        recs.push(
          language === 'en'
            ? `Consider adding £${Math.min(50, availableBalance).toFixed(0)} extra to your ${highestAPRDebt.name} payment to save on interest.`
            : `Considera añadir £${Math.min(50, availableBalance).toFixed(0)} extra al pago de ${highestAPRDebt.name} para ahorrar en intereses.`
        );
      }

      // Check for promotional APR ending soon
      const promoEndingSoon = debts.filter(d => {
        if (!d.promotional_apr_end_date) return false;
        const endDate = new Date(d.promotional_apr_end_date);
        const today = new Date();
        const monthsUntilEnd = (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsUntilEnd > 0 && monthsUntilEnd <= 3;
      });

      if (promoEndingSoon.length > 0) {
        recs.push(
          language === 'en'
            ? `Your promotional APR on ${promoEndingSoon[0].name} ends soon. Prioritize this debt to avoid higher interest rates.`
            : `Tu APR promocional en ${promoEndingSoon[0].name} termina pronto. Prioriza esta deuda para evitar tasas de interés más altas.`
        );
      }
    }

    // Emergency fund recommendations
    if (emergencyFundTarget > 0 && emergencyFund < emergencyFundTarget) {
      const monthsOfExpenses = emergencyFund / totalExpenses;
      const targetMonths = emergencyFundTarget / totalExpenses;
      const remaining = emergencyFundTarget - emergencyFund;

      if (monthsOfExpenses < 3) {
        recs.push(
          language === 'en'
            ? `Add £${Math.min(20, availableBalance).toFixed(0)} to your emergency fund this month to reach ${targetMonths.toFixed(0)} months of expenses.`
            : `Aumenta £${Math.min(20, availableBalance).toFixed(0)} tu fondo de emergencia este mes para alcanzar ${targetMonths.toFixed(0)} meses de gastos.`
        );
      }

      if (availableBalance >= 100 && remaining > 0) {
        const monthsToGoal = remaining / Math.min(100, availableBalance);
        recs.push(
          language === 'en'
            ? `You could reach your emergency fund goal in ${Math.ceil(monthsToGoal)} months by saving £${Math.min(100, availableBalance).toFixed(0)} monthly.`
            : `Podrías alcanzar tu meta de fondo de emergencia en ${Math.ceil(monthsToGoal)} meses ahorrando £${Math.min(100, availableBalance).toFixed(0)} mensuales.`
        );
      }
    }

    // Variable expenses recommendations
    if (totalVariableExpenses > totalIncome * 0.3) {
      const potential = totalVariableExpenses * 0.1;
      recs.push(
        language === 'en'
          ? `Your variable expenses are high. Reducing them by 10% could save you £${potential.toFixed(2)} this month.`
          : `Tus gastos variables son altos. Reducirlos un 10% podría ahorrarte £${potential.toFixed(2)} este mes.`
      );
    }

    // Savings recommendations
    if (availableBalance > 0 && totalSavings === 0) {
      recs.push(
        language === 'en'
          ? `You have £${availableBalance.toFixed(2)} available. Start building your savings today!`
          : `Tienes £${availableBalance.toFixed(2)} disponibles. ¡Empieza a construir tus ahorros hoy!`
      );
    }

    // General positive reinforcement
    if (availableBalance > 100) {
      recs.push(
        language === 'en'
          ? `Great job! You have £${availableBalance.toFixed(2)} left after expenses. Consider allocating it between debts and savings.`
          : `¡Excelente trabajo! Te quedan £${availableBalance.toFixed(2)} después de gastos. Considera distribuirlos entre deudas y ahorros.`
      );
    }

    // Default if no specific recommendations
    if (recs.length === 0) {
      recs.push(
        language === 'en'
          ? "Keep tracking your finances regularly to stay on top of your financial goals!"
          : "¡Sigue monitoreando tus finanzas regularmente para mantener tus metas financieras!"
      );
    }

    setRecommendations(recs);
  };

  const nextRecommendation = () => {
    setCurrentRecommendation((prev) => (prev + 1) % recommendations.length);
  };

  if (recommendations.length === 0) return null;

  return (
    <Card className="shadow-medium border-primary/20">
      <CardHeader className="bg-gradient-primary text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <CardTitle className="text-lg">
              {language === 'en' ? 'Daily Recommendation' : 'Recomendación Diaria'}
            </CardTitle>
          </div>
          {recommendations.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={nextRecommendation}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription className="text-primary-foreground/80 text-sm">
          {language === 'en' ? 'Personalized insight for today' : 'Perspectiva personalizada para hoy'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-base leading-relaxed">
          {recommendations[currentRecommendation]}
        </p>
        {recommendations.length > 1 && (
          <div className="flex gap-1 mt-4 justify-center">
            {recommendations.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentRecommendation
                    ? 'w-8 bg-primary'
                    : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};