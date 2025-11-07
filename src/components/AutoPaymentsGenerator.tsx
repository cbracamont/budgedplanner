import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Loader2 } from "lucide-react";
import { Language } from "@/lib/i18n";

interface AutoPaymentsGeneratorProps {
  language: Language;
}

export const AutoPaymentsGenerator = ({ language }: AutoPaymentsGeneratorProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const t = {
    en: {
      title: "Automatic Debt Payments",
      description: "Generate automatic payment schedules for your debts",
      generate: "Generate Payments",
      generating: "Generating...",
      success: "Payments generated successfully",
      error: "Failed to generate payments",
      info: "This will automatically create payment entries for all your active debts for 3 months before and 6 months after the current month based on their payment dates."
    },
    es: {
      title: "Pagos Automáticos de Deudas",
      description: "Genera calendarios de pago automáticos para tus deudas",
      generate: "Generar Pagos",
      generating: "Generando...",
      success: "Pagos generados exitosamente",
      error: "Error al generar pagos",
      info: "Esto creará automáticamente entradas de pago para todas tus deudas activas para 3 meses anteriores y 6 meses posteriores al mes actual según sus fechas de pago."
    },
    pl: {
      title: "Automatyczne Płatności Długów",
      description: "Wygeneruj automatyczne harmonogramy płatności dla swoich długów",
      generate: "Generuj Płatności",
      generating: "Generowanie...",
      success: "Płatności wygenerowane pomyślnie",
      error: "Nie udało się wygenerować płatności",
      info: "Spowoduje to automatyczne utworzenie wpisów płatności dla wszystkich aktywnych długów na 3 miesiące przed i 6 miesięcy po bieżącym miesiącu na podstawie ich dat płatności."
    }
  }[language];

  const handleGeneratePayments = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-generate-debt-payments', {
        body: { time: new Date().toISOString() }
      });

      if (error) throw error;

      toast({
        title: t.success,
        description: data?.message || t.success,
      });
    } catch (error) {
      console.error('Error generating payments:', error);
      toast({
        title: t.error,
        description: error instanceof Error ? error.message : t.error,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{t.info}</p>
        <Button
          onClick={handleGeneratePayments}
          disabled={isGenerating}
          className="w-full sm:w-auto"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.generating}
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              {t.generate}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
