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

const txt = (language: Language, en: string, es: string, pt: string) =>
  language === "en" ? en : language === "es" ? es : pt;

export const DebtAdvisor = ({ debts, extraPayment, language }: DebtAdvisorProps) => {
  const t = (key: string) => getTranslation(language, key);

  const calculateDebtFreeDate = () => {
    if (debts.length === 0) return null;
    const totalMonthlyPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const monthsToPayOff = Math.ceil(totalBalance / totalMonthlyPayment);
    const debtFreeDate = new Date();
    debtFreeDate.setMonth(debtFreeDate.getMonth() + monthsToPayOff);
    return debtFreeDate;
  };

  const prioritizeDebts = () => [...debts].sort((a, b) => b.apr - a.apr);

  const calculateInterestSavings = () => {
    if (extraPayment <= 0 || debts.length === 0) return 0;
    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const avgAPR = debts.reduce((sum, d) => sum + d.apr, 0) / debts.length;
    const monthsWithoutExtra = Math.ceil(totalBalance / debts.reduce((sum, d) => sum + d.minimumPayment, 0));
    const monthsWithExtra = Math.ceil(totalBalance / (debts.reduce((sum, d) => sum + d.minimumPayment, 0) + extraPayment));
    const monthsSaved = monthsWithoutExtra - monthsWithExtra;
    const interestSaved = (totalBalance * (avgAPR / 100) / 12) * monthsSaved;
    return Math.max(0, interestSaved);
  };

  const getSmartRecommendations = () => {
    if (debts.length === 0) return [];
    const recommendations = [];
    const prioritized = prioritizeDebts();
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

    if (prioritized.length > 0 && prioritized[0].apr > 15) {
      recommendations.push({
        title: txt(language, 'High Interest Alert', 'Alerta de Alto Interés', 'Alerta de Juros Altos'),
        description: txt(language,
          `Focus on ${prioritized[0].name} first - it has ${prioritized[0].apr}% APR. Every extra payment saves significant interest.`,
          `Concéntrate primero en ${prioritized[0].name} - tiene ${prioritized[0].apr}% de TAE. Cada pago extra ahorra intereses significativos.`,
          `Foque primeiro em ${prioritized[0].name} - tem ${prioritized[0].apr}% de TAE. Cada pagamento extra poupa juros significativos.`
        ),
        priority: 'high'
      });
    }

    if (extraPayment > totalMinPayment * 0.5) {
      recommendations.push({
        title: txt(language, 'Keep Emergency Reserve', 'Mantén Reserva de Emergencia', 'Mantenha Reserva de Emergência'),
        description: txt(language,
          'Consider keeping £500-£1000 as emergency fund before aggressive debt payoff.',
          'Considera mantener £500-£1000 como fondo de emergencia antes de pagar deudas agresivamente.',
          'Considere manter £500-£1000 como fundo de emergência antes de pagar dívidas agressivamente.'
        ),
        priority: 'medium'
      });
    }

    const smallestDebt = [...debts].sort((a, b) => a.balance - b.balance)[0];
    if (smallestDebt && smallestDebt.balance < 1000) {
      recommendations.push({
        title: txt(language, 'Quick Win Strategy', 'Estrategia de Victoria Rápida', 'Estratégia de Vitória Rápida'),
        description: txt(language,
          `${smallestDebt.name} (${formatCurrency(smallestDebt.balance)}) could be paid off quickly for motivation boost.`,
          `${smallestDebt.name} (${formatCurrency(smallestDebt.balance)}) podría pagarse rápido para motivación extra.`,
          `${smallestDebt.name} (${formatCurrency(smallestDebt.balance)}) pode ser pago rapidamente para motivação extra.`
        ),
        priority: 'low'
      });
    }

    return recommendations;
  };

  const debtFreeDate = calculateDebtFreeDate();
  const prioritizedDebts = prioritizeDebts();
  const interestSavings = calculateInterestSavings();
  const recommendations = getSmartRecommendations();

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
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">
              {txt(language, '💡 Smart Recommendations', '💡 Recomendaciones Inteligentes', '💡 Recomendações Inteligentes')}
            </h3>
            {recommendations.map((rec, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border ${
                  rec.priority === 'high' ? 'bg-debt/10 border-debt/20' :
                  rec.priority === 'medium' ? 'bg-warning/10 border-warning/20' :
                  'bg-success/10 border-success/20'
                }`}
              >
                <p className="font-semibold mb-1">{rec.title}</p>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
              </div>
            ))}
          </div>
        )}

        {debtFreeDate && (
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{t('debtFreeDate')}</p>
                <p className="text-2xl font-bold text-success">
                  {debtFreeDate.toLocaleDateString(language === 'en' ? 'en-GB' : language === 'es' ? 'es-ES' : 'pt-BR', { 
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
                <div key={index} className="p-3 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{index + 1}. {debt.name}</p>
                      <p className="text-sm text-muted-foreground">APR: {debt.apr}% • {formatCurrency(debt.balance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-debt">{formatCurrency(debt.minimumPayment)}/mo</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.ceil(debt.balance / debt.minimumPayment)} {txt(language, 'months', 'meses', 'meses')}
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
            <p className="text-2xl font-bold text-income">{formatCurrency(interestSavings)}</p>
          </div>
        )}

        {debts.length === 0 && (
          <div className="p-4 bg-success/10 rounded-lg">
            <p className="text-sm text-success font-medium">{t('noDebts')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
