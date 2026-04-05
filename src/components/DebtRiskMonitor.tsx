import { useEffect, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, CheckCircle2 } from "lucide-react";
import { useUnacknowledgedAlerts, useAcknowledgeAlert, useCreateDebtRiskAlert } from "@/hooks/useDebtRiskAlerts";
import { Language, getTranslation } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DebtRiskMonitorProps {
  totalIncome: number;
  totalDebts: number;
  language: Language;
}

const txt = (lang: Language, en: string, es: string, pt: string) =>
  lang === "en" ? en : lang === "es" ? es : pt;

export const DebtRiskMonitor = ({ totalIncome, totalDebts, language }: DebtRiskMonitorProps) => {
  const { data: alerts } = useUnacknowledgedAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();
  const createAlert = useCreateDebtRiskAlert();
  const isCreatingAlert = useRef(false);

  useEffect(() => {
    const checkDebtRatio = async () => {
      if (totalIncome <= 0 || isCreatingAlert.current) return;

      const debtToIncomeRatio = (totalDebts / totalIncome) * 100;

      if (debtToIncomeRatio > 35) {
        const recentAlerts = alerts?.filter(
          a => a.alert_type === "high_debt_ratio" && 
          new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );

        if (!recentAlerts || recentAlerts.length === 0) {
          isCreatingAlert.current = true;
          
          let riskLevel = "medium";
          let message = "";

          if (debtToIncomeRatio >= 40) {
            riskLevel = "high";
            message = txt(language,
              `⚠️ CRITICAL ALERT: Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%. It's recommended to keep it below 40%. Consider debt consolidation or financial counseling.`,
              `⚠️ ALERTA CRÍTICA: Tu ratio deuda/ingresos es del ${debtToIncomeRatio.toFixed(1)}%. Se recomienda mantenerlo por debajo del 40%. Considera consolidar deudas o buscar asesoría financiera.`,
              `⚠️ ALERTA CRÍTICO: O seu rácio dívida/rendimento é de ${debtToIncomeRatio.toFixed(1)}%. Recomenda-se mantê-lo abaixo de 40%. Considere consolidar dívidas ou procurar aconselhamento financeiro.`
            );
          } else {
            message = txt(language,
              `⚠️ Warning: Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%. It's approaching the recommended limit of 35%. Consider reducing expenses or increasing debt payments.`,
              `⚠️ Advertencia: Tu ratio deuda/ingresos es del ${debtToIncomeRatio.toFixed(1)}%. Se acerca al límite recomendado del 35%. Considera reducir gastos o aumentar pagos de deudas.`,
              `⚠️ Aviso: O seu rácio dívida/rendimento é de ${debtToIncomeRatio.toFixed(1)}%. Está a aproximar-se do limite recomendado de 35%. Considere reduzir despesas ou aumentar pagamentos de dívidas.`
            );
          }

          try {
            await createAlert.mutateAsync({
              alert_type: "high_debt_ratio",
              risk_level: riskLevel,
              debt_to_income_ratio: debtToIncomeRatio,
              message,
              profile_id: null,
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("notifications").insert([{
                user_id: user.id,
                title: txt(language, "⚠️ Over-Indebtedness Alert", "⚠️ Alerta de Sobreendeudamiento", "⚠️ Alerta de Sobreendividamento"),
                message,
                type: "debt_alert",
                is_read: false,
              }]);
            }
          } finally {
            setTimeout(() => {
              isCreatingAlert.current = false;
            }, 5000);
          }
        }
      }
    };

    checkDebtRatio();
  }, [totalIncome, totalDebts, language, alerts, createAlert]);

  if (!alerts || alerts.length === 0) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "destructive";
      default: return "default";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "high": return <AlertTriangle className="h-5 w-5" />;
      case "medium": return <TrendingDown className="h-5 w-5" />;
      default: return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant={getRiskColor(alert.risk_level) as any}>
          <div className="flex items-start gap-3">
            {getRiskIcon(alert.risk_level)}
            <div className="flex-1">
              <AlertTitle className="mb-2">
                {txt(language, "Financial Risk Alert", "Alerta de Riesgo Financiero", "Alerta de Risco Financeiro")}
              </AlertTitle>
              <AlertDescription className="mb-3">
                {alert.message}
              </AlertDescription>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    acknowledgeAlert.mutate(alert.id);
                    toast.success(txt(language, "Alert acknowledged", "Alerta reconocida", "Alerta reconhecido"));
                  }}
                >
                  {txt(language, "Acknowledge", "Entendido", "Entendido")}
                </Button>
              </div>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};
