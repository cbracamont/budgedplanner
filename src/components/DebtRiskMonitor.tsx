import { useEffect } from "react";
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

export const DebtRiskMonitor = ({ totalIncome, totalDebts, language }: DebtRiskMonitorProps) => {
  const { data: alerts } = useUnacknowledgedAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();
  const createAlert = useCreateDebtRiskAlert();

  useEffect(() => {
    const checkDebtRatio = async () => {
      if (totalIncome <= 0) return;

      const debtToIncomeRatio = (totalDebts / totalIncome) * 100;

      // Solo crear alerta si supera el 35% y no hay alertas recientes similares
      if (debtToIncomeRatio > 35) {
        const recentAlerts = alerts?.filter(
          a => a.alert_type === "high_debt_ratio" && 
          new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // últimos 7 días
        );

        if (!recentAlerts || recentAlerts.length === 0) {
          let riskLevel = "medium";
          let message = "";

          if (debtToIncomeRatio >= 40) {
            riskLevel = "high";
            message = language === "es" 
              ? `⚠️ ALERTA CRÍTICA: Tu ratio deuda/ingresos es del ${debtToIncomeRatio.toFixed(1)}%. Se recomienda mantenerlo por debajo del 40%. Considera consolidar deudas o buscar asesoría financiera.`
              : `⚠️ CRITICAL ALERT: Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%. It's recommended to keep it below 40%. Consider debt consolidation or financial counseling.`;
          } else {
            message = language === "es"
              ? `⚠️ Advertencia: Tu ratio deuda/ingresos es del ${debtToIncomeRatio.toFixed(1)}%. Se acerca al límite recomendado del 35%. Considera reducir gastos o aumentar pagos de deudas.`
              : `⚠️ Warning: Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%. It's approaching the recommended limit of 35%. Consider reducing expenses or increasing debt payments.`;
          }

          await createAlert.mutateAsync({
            alert_type: "high_debt_ratio",
            risk_level: riskLevel,
            debt_to_income_ratio: debtToIncomeRatio,
            message,
            profile_id: null,
          });

          // También crear notificación y enviar email
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("notifications").insert([{
              user_id: user.id,
              title: language === "es" ? "⚠️ Alerta de Sobreendeudamiento" : "⚠️ Over-Indebtedness Alert",
              message,
              type: "debt_alert",
              is_read: false,
            }]);

            // Enviar email de notificación
            if (user.email) {
              try {
                await supabase.functions.invoke('send-notification-email', {
                  body: {
                    email: user.email,
                    title: language === "es" ? "⚠️ Alerta de Sobreendeudamiento" : "⚠️ Over-Indebtedness Alert",
                    message,
                    type: "alert",
                  }
                });
              } catch (error) {
                console.error("Error sending notification email:", error);
              }
            }
          }
        }
      }
    };

    checkDebtRatio();
  }, [totalIncome, totalDebts, language, alerts, createAlert]);

  if (!alerts || alerts.length === 0) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "default";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="h-5 w-5" />;
      case "medium":
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <CheckCircle2 className="h-5 w-5" />;
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
                {language === "es" ? "Alerta de Riesgo Financiero" : "Financial Risk Alert"}
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
                    toast.success(language === "es" ? "Alerta reconocida" : "Alert acknowledged");
                  }}
                >
                  {language === "es" ? "Entendido" : "Acknowledge"}
                </Button>
              </div>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};