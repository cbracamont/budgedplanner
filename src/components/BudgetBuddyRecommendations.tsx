import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Lightbulb, ArrowRight, RefreshCw } from "lucide-react";
import { Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useBudgetRecommendations } from "@/hooks/useBudgetRecommendations";
import { Skeleton } from "@/components/ui/skeleton";
interface BudgetAllocation {
  category: string;
  amount: number;
  target_id?: string;
  target_type?: 'debt' | 'savings_goal' | 'emergency_fund';
}
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  allocations: BudgetAllocation[];
  total_amount: number;
}
interface BudgetBuddyRecommendationsProps {
  language: Language;
  profileId: string | undefined;
  onAccept: (recommendation: Recommendation) => Promise<void>;
}
export const BudgetBuddyRecommendations = ({
  language,
  profileId,
  onAccept
}: BudgetBuddyRecommendationsProps) => {
  const {
    toast
  } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const {
    recommendations,
    isLoading,
    error,
    refetch
  } = useBudgetRecommendations(profileId);
  const visibleRecommendations = recommendations.filter(r => !dismissedIds.has(r.id));
  const handleAccept = async (recommendation: Recommendation) => {
    setProcessingId(recommendation.id);
    try {
      await onAccept(recommendation);
      setDismissedIds(prev => new Set([...prev, recommendation.id]));
      toast({
        title: language === 'en' ? 'Recommendation Applied' : 'Recomendación Aplicada',
        description: language === 'en' ? 'The budget allocation has been applied successfully' : 'La distribución del presupuesto se ha aplicado correctamente'
      });
    } catch (error) {
      console.error('Error applying recommendation:', error);
      toast({
        title: 'Error',
        description: language === 'en' ? 'Failed to apply recommendation' : 'Error al aplicar la recomendación',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };
  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };
  const handleRefresh = () => {
    setDismissedIds(new Set());
    refetch();
  };
  if (isLoading) {
    return <Card className="shadow-medium border-primary/20">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <CardTitle className="text-lg">
              {language === 'en' ? 'Smart Budget Recommendations' : 'Recomendaciones Inteligentes de Presupuesto'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="shadow-medium border-primary/20">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <CardTitle className="text-lg">
              {language === 'en' ? 'Smart Budget Recommendations' : 'Recomendaciones Inteligentes de Presupuesto'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Try Again' : 'Intentar de nuevo'}
          </Button>
        </CardContent>
      </Card>;
  }
  if (visibleRecommendations.length === 0) return null;
  return <Card className="shadow-medium border-primary/20">
      
      
    </Card>;
};