import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingDown, Lightbulb, Calendar, PoundSterling } from "lucide-react";
import { Language } from "@/lib/i18n";

interface Debt {
  id?: string;
  name: string;
  balance: number;
  apr: number;
  minimumPayment: number;
  promotional_apr?: number;
  promotional_apr_end_date?: string;
  regular_apr?: number;
}

interface EnhancedDebtAdvisorProps {
  debts: Debt[];
  extraPayment: number;
  language: Language;
}

export const EnhancedDebtAdvisor = ({ debts, extraPayment, language }: EnhancedDebtAdvisorProps) => {
  const [selectedDebtId, setSelectedDebtId] = useState<string>("");
  const [customExtraPayment, setCustomExtraPayment] = useState(extraPayment.toString());

  // Calculate total debt-free date for ALL debts
  const calculateTotalDebtFreeDate = () => {
    if (debts.length === 0) return null;
    
    let remainingDebts = [...debts].map(d => ({ ...d }));
    let month = 0;
    const monthlyPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0) + (parseFloat(customExtraPayment) || 0);
    
    // Sort debts by APR (Avalanche method)
    remainingDebts.sort((a, b) => b.apr - a.apr);
    
    while (remainingDebts.some(d => d.balance > 0)) {
      month++;
      if (month > 1200) break; // Safety check (100 years max)
      
      let extraAvailable = parseFloat(customExtraPayment) || 0;
      
      // Apply minimum payments
      remainingDebts.forEach(debt => {
        if (debt.balance > 0) {
          const monthlyRate = debt.apr / 100 / 12;
          const interest = debt.balance * monthlyRate;
          const payment = Math.min(debt.minimumPayment, debt.balance + interest);
          debt.balance = debt.balance + interest - payment;
        }
      });
      
      // Apply extra payment to highest APR debt
      for (let i = 0; i < remainingDebts.length && extraAvailable > 0; i++) {
        if (remainingDebts[i].balance > 0) {
          const payment = Math.min(extraAvailable, remainingDebts[i].balance);
          remainingDebts[i].balance -= payment;
          extraAvailable -= payment;
        }
      }
    }
    
    const debtFreeDate = new Date();
    debtFreeDate.setMonth(debtFreeDate.getMonth() + month);
    return debtFreeDate;
  };

  const calculateDebtFreeDate = (debt: Debt, additionalPayment: number = 0) => {
    const monthlyPayment = debt.minimumPayment + additionalPayment;
    const monthlyRate = debt.apr / 100 / 12;
    
    if (monthlyRate === 0) {
      return Math.ceil(debt.balance / monthlyPayment);
    }
    
    const months = Math.log(monthlyPayment / (monthlyPayment - debt.balance * monthlyRate)) / Math.log(1 + monthlyRate);
    return Math.ceil(months);
  };

  const prioritizeDebts = () => {
    const today = new Date();
    
    return [...debts].sort((a, b) => {
      // Calculate effective APR considering promotional periods
      const getEffectiveAPR = (debt: Debt) => {
        if (debt.promotional_apr !== undefined && debt.promotional_apr_end_date) {
          const endDate = new Date(debt.promotional_apr_end_date);
          if (endDate > today) {
            // Promotional period is active - use promotional APR
            return debt.promotional_apr;
          } else {
            // Promotional period ended - use regular APR
            return debt.regular_apr || debt.apr;
          }
        }
        // No promotional APR - use standard APR
        return debt.apr;
      };

      const aprA = getEffectiveAPR(a);
      const aprB = getEffectiveAPR(b);

      // Sort by effective APR (highest first) - Avalanche method
      return aprB - aprA;
    });
  };

  const calculateInterestSavings = () => {
    let totalInterestMinimum = 0;
    let totalInterestWithExtra = 0;

    debts.forEach(debt => {
      const monthsMinimum = calculateDebtFreeDate(debt, 0);
      const monthsWithExtra = selectedDebtId && debt.name === debts.find(d => d.name === selectedDebtId)?.name
        ? calculateDebtFreeDate(debt, parseFloat(customExtraPayment) || 0)
        : calculateDebtFreeDate(debt, 0);

      const monthlyRate = debt.apr / 100 / 12;
      
      totalInterestMinimum += (debt.minimumPayment * monthsMinimum) - debt.balance;
      
      const monthlyWithExtra = selectedDebtId && debt.name === debts.find(d => d.name === selectedDebtId)?.name
        ? debt.minimumPayment + (parseFloat(customExtraPayment) || 0)
        : debt.minimumPayment;
      
      totalInterestWithExtra += (monthlyWithExtra * monthsWithExtra) - debt.balance;
    });

    return Math.max(0, totalInterestMinimum - totalInterestWithExtra);
  };

  const getSmartRecommendations = () => {
    const recommendations: string[] = [];
    const sortedDebts = prioritizeDebts();
    const extraAmount = parseFloat(customExtraPayment) || 0;
    const today = new Date();

    if (debts.length === 0) {
      return [language === 'en' 
        ? "No debts registered. You're debt-free!" 
        : "No hay deudas registradas. ¡Estás libre de deudas!"];
    }

    // Check for promotional APR ending soon
    const promoEndingSoon = debts.filter(d => {
      if (!d.promotional_apr_end_date) return false;
      const endDate = new Date(d.promotional_apr_end_date);
      const monthsUntilEnd = (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsUntilEnd > 0 && monthsUntilEnd <= 3;
    });

    if (promoEndingSoon.length > 0) {
      const debt = promoEndingSoon[0];
      const endDate = new Date(debt.promotional_apr_end_date!);
      const regularAPR = debt.regular_apr || debt.apr;
      recommendations.push(
        language === 'en'
          ? `URGENT: ${debt.name}'s promotional APR (${debt.promotional_apr}%) ends ${endDate.toLocaleDateString()}. APR will increase to ${regularAPR}%. Prioritize this debt!`
          : `URGENTE: El APR promocional de ${debt.name} (${debt.promotional_apr}%) termina ${endDate.toLocaleDateString()}. El APR aumentará a ${regularAPR}%. ¡Prioriza esta deuda!`
      );
    }

    if (extraAmount > 0) {
      const topDebt = sortedDebts[0];
      const effectiveAPR = topDebt.promotional_apr && topDebt.promotional_apr_end_date && new Date(topDebt.promotional_apr_end_date) > today
        ? topDebt.promotional_apr
        : (topDebt.regular_apr || topDebt.apr);
      
      recommendations.push(
        language === 'en'
          ? `Apply £${extraAmount.toFixed(2)} extra to ${topDebt.name} (current APR: ${effectiveAPR}%) to save on interest.`
          : `Aplica £${extraAmount.toFixed(2)} extra a ${topDebt.name} (APR actual: ${effectiveAPR}%) para ahorrar en intereses.`
      );
    }

    if (sortedDebts.length > 1) {
      const firstDebt = sortedDebts[0];
      const secondDebt = sortedDebts[1];
      recommendations.push(
        language === 'en'
          ? `Focus on ${firstDebt.name} first, then move to ${secondDebt.name}.`
          : `Enfócate en ${firstDebt.name} primero, luego pasa a ${secondDebt.name}.`
      );
    }

    const highAPRDebts = debts.filter(d => {
      const effectiveAPR = d.promotional_apr && d.promotional_apr_end_date && new Date(d.promotional_apr_end_date) > today
        ? d.promotional_apr
        : (d.regular_apr || d.apr);
      return effectiveAPR > 15;
    });
    
    if (highAPRDebts.length > 0) {
      recommendations.push(
        language === 'en'
          ? `Consider consolidating high-APR debts (${highAPRDebts.map(d => d.name).join(', ')}) into a lower-rate loan.`
          : `Considera consolidar deudas con APR alto (${highAPRDebts.map(d => d.name).join(', ')}) en un préstamo con tasa más baja.`
      );
    }

    return recommendations;
  };

  const totalDebtFreeDate = calculateTotalDebtFreeDate();
  const selectedDebt = debts.find(d => d.name === selectedDebtId);
  const monthsToPayoff = selectedDebt ? calculateDebtFreeDate(selectedDebt, parseFloat(customExtraPayment) || 0) : 0;
  const debtFreeDate = selectedDebt ? new Date(Date.now() + monthsToPayoff * 30 * 24 * 60 * 60 * 1000) : null;

  return (
    <Card className="shadow-medium">
      <CardHeader className="bg-gradient-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          <CardTitle>{language === 'en' ? 'Debt Payoff Strategy' : 'Estrategia de Pago de Deudas'}</CardTitle>
        </div>
        <CardDescription className="text-primary-foreground/80">
          {language === 'en' 
            ? 'Optimize your debt repayment with smart recommendations' 
            : 'Optimiza el pago de tus deudas con recomendaciones inteligentes'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Extra Payment Allocation */}
        <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="debt-select" className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-primary" />
              {language === 'en' ? 'Apply Extra Payment To:' : 'Aplicar Pago Extra A:'}
            </Label>
            <Select value={selectedDebtId} onValueChange={setSelectedDebtId}>
              <SelectTrigger id="debt-select">
                <SelectValue placeholder={language === 'en' ? 'Select a debt' : 'Selecciona una deuda'} />
              </SelectTrigger>
              <SelectContent>
                {debts.map((debt) => (
                  <SelectItem key={debt.name} value={debt.name}>
                    {debt.name} (£{debt.balance.toFixed(2)} @ {debt.apr}% APR)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra-amount">
              {language === 'en' ? 'Extra Monthly Payment' : 'Pago Mensual Extra'}
            </Label>
            <Input
              id="extra-amount"
              type="number"
              step="0.01"
              value={customExtraPayment}
              onChange={(e) => setCustomExtraPayment(e.target.value)}
              onBlur={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  setCustomExtraPayment(value.toFixed(2));
                }
              }}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Total Debt-Free Date */}
        {totalDebtFreeDate && debts.length > 0 && (
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-success mt-1" />
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  {language === 'en' ? 'Projected Debt-Free Date (All Debts):' : 'Fecha Proyectada Libre de Todas las Deudas:'}
                </p>
                <p className="text-2xl font-bold text-success">
                  {totalDebtFreeDate?.toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Combining all debts with current payment strategy' 
                    : 'Combinando todas las deudas con la estrategia de pago actual'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Projected Debt-Free Date for Individual Debt */}
        {selectedDebt && parseFloat(customExtraPayment) > 0 && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-1" />
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  {language === 'en' ? 'Individual Debt Payoff for' : 'Pago Individual de Deuda para'} {selectedDebt.name}:
                </p>
                <p className="text-2xl font-bold text-primary">
                  {debtFreeDate?.toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  ({monthsToPayoff} {monthsToPayoff === 1 
                    ? (language === 'en' ? 'month' : 'mes')
                    : (language === 'en' ? 'months' : 'meses')})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Smart Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{language === 'en' ? 'Smart Recommendations' : 'Recomendaciones Inteligentes'}</h3>
          </div>
          <div className="space-y-2">
            {getSmartRecommendations().map((rec, index) => (
              <div key={index} className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Priority List */}
        {debts.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">
              {language === 'en' ? 'Recommended Payoff Order (Avalanche Method)' : 'Orden de Pago Recomendado (Método Avalancha)'}
            </h3>
            <div className="space-y-2">
              {prioritizeDebts().map((debt, index) => {
                const today = new Date();
                const hasPromo = debt.promotional_apr && debt.promotional_apr_end_date && new Date(debt.promotional_apr_end_date) > today;
                const effectiveAPR = hasPromo ? debt.promotional_apr : (debt.regular_apr || debt.apr);
                
                return (
                  <div key={debt.name} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{debt.name}</p>
                      <p className="text-sm text-muted-foreground">
                        £{debt.balance.toFixed(2)} @ {effectiveAPR}% APR
                        {hasPromo && (
                          <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                            ({language === 'en' ? 'Promo until' : 'Promo hasta'} {new Date(debt.promotional_apr_end_date!).toLocaleDateString()})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interest Savings */}
        {selectedDebt && parseFloat(customExtraPayment) > 0 && (
          <div className="p-4 bg-success/10 rounded-lg">
            <p className="text-sm font-semibold text-success">
              {language === 'en' ? 'Potential Interest Savings:' : 'Ahorro Potencial en Intereses:'}
            </p>
            <p className="text-2xl font-bold text-success">
              £{calculateInterestSavings().toFixed(2)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};