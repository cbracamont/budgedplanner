import { useState } from "react";
import { Lightbulb, X, Check, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Language } from "@/lib/i18n";
import { useBudgetRecommendations } from "@/hooks/useBudgetRecommendations";
import { useToast } from "@/hooks/use-toast";
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

interface FloatingBudgetBuddyProps {
  language: Language;
  profileId: string | undefined;
  onAccept: (recommendation: Recommendation) => Promise<void>;
}

export const FloatingBudgetBuddy = ({
  language,
  profileId,
  onAccept
}: FloatingBudgetBuddyProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
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

  // Don't show the button if there are no recommendations and not loading
  if (!isLoading && visibleRecommendations.length === 0 && !error) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-elegant hover:shadow-glow transition-all z-50 bg-gradient-primary"
        size="icon"
      >
        <Lightbulb className="h-6 w-6" />
        {visibleRecommendations.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {visibleRecommendations.length}
          </span>
        )}
      </Button>

      {/* Floating Window */}
      {isOpen && (
        <Card className="fixed bottom-40 right-6 w-96 max-w-[calc(100vw-3rem)] shadow-elegant z-50 border-primary/20">
          <CardHeader className="bg-gradient-primary text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Budget Buddy' : 'Asistente de Presupuesto'}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-primary-foreground/80">
              {language === 'en' 
                ? 'Smart recommendations for your budget' 
                : 'Recomendaciones inteligentes para tu presupuesto'}
            </CardDescription>
          </CardHeader>
          
          <ScrollArea className="h-96">
            <CardContent className="pt-6 space-y-4">
              {isLoading && (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Try Again' : 'Intentar de nuevo'}
                  </Button>
                </div>
              )}

              {!isLoading && !error && visibleRecommendations.length === 0 && (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'No recommendations available at the moment' 
                      : 'No hay recomendaciones disponibles en este momento'}
                  </p>
                  <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Refresh' : 'Actualizar'}
                  </Button>
                </div>
              )}

              {!isLoading && !error && visibleRecommendations.map((recommendation) => (
                <Card key={recommendation.id} className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{recommendation.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {recommendation.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {recommendation.allocations.map((allocation, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{allocation.category}</span>
                          <span className="font-medium">
                            ${allocation.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>{language === 'en' ? 'Total' : 'Total'}</span>
                        <span>${recommendation.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleAccept(recommendation)}
                        disabled={processingId === recommendation.id}
                        size="sm"
                        className="flex-1"
                      >
                        {processingId === recommendation.id ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        {language === 'en' ? 'Accept' : 'Aceptar'}
                      </Button>
                      <Button
                        onClick={() => handleDismiss(recommendation.id)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>
      )}
    </>
  );
};
