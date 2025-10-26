import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Lightbulb, ArrowRight } from "lucide-react";
import { Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BudgetAllocation {
  category: string;
  amount: number;
  target_id?: string;
  target_type?: 'debt' | 'savings_goal' | 'emergency_fund';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  allocations: BudgetAllocation[];
  total_amount: number;
}

interface BudgetBuddyRecommendationsProps {
  language: Language;
  recommendations: Recommendation[];
  onAccept: (recommendation: Recommendation) => Promise<void>;
  onDismiss: (recommendationId: string) => void;
}

export const BudgetBuddyRecommendations = ({
  language,
  recommendations,
  onAccept,
  onDismiss
}: BudgetBuddyRecommendationsProps) => {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (recommendation: Recommendation) => {
    setProcessingId(recommendation.id);
    try {
      await onAccept(recommendation);
      toast({
        title: language === 'en' ? 'Recommendation Applied' : 'Recomendación Aplicada',
        description: language === 'en' 
          ? 'The budget allocation has been applied successfully'
          : 'La distribución del presupuesto se ha aplicado correctamente'
      });
    } catch (error) {
      console.error('Error applying recommendation:', error);
      toast({
        title: 'Error',
        description: language === 'en'
          ? 'Failed to apply recommendation'
          : 'Error al aplicar la recomendación',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (recommendations.length === 0) return null;

  return (
    <Card className="shadow-medium border-primary/20">
      <CardHeader className="bg-gradient-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          <CardTitle className="text-lg">
            {language === 'en' ? 'Smart Budget Recommendations' : 'Recomendaciones Inteligentes de Presupuesto'}
          </CardTitle>
        </div>
        <CardDescription className="text-primary-foreground/80 text-sm">
          {language === 'en' 
            ? 'AI-powered suggestions to optimize your finances'
            : 'Sugerencias impulsadas por IA para optimizar tus finanzas'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">{recommendation.title}</h3>
              <p className="text-sm text-muted-foreground">{recommendation.description}</p>
            </div>

            <div className="space-y-2 bg-secondary/30 rounded-md p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                {language === 'en' ? 'Proposed Allocation' : 'Distribución Propuesta'}
              </p>
              {recommendation.allocations.map((allocation, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    {allocation.category}
                  </span>
                  <span className="font-semibold">£{allocation.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex items-center justify-between font-bold">
                <span>{language === 'en' ? 'Total' : 'Total'}</span>
                <span>£{recommendation.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleAccept(recommendation)}
                disabled={processingId === recommendation.id}
                className="flex-1"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                {processingId === recommendation.id
                  ? (language === 'en' ? 'Applying...' : 'Aplicando...')
                  : (language === 'en' ? 'Accept & Apply' : 'Aceptar y Aplicar')}
              </Button>
              <Button
                onClick={() => onDismiss(recommendation.id)}
                disabled={processingId === recommendation.id}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Dismiss' : 'Descartar'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};