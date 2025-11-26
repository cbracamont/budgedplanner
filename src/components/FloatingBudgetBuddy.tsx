import { useState, useEffect } from "react";
import { TrendingUp, X, RefreshCw, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Language } from "@/lib/i18n";
import { useFinancialInsights } from "@/hooks/useFinancialInsights";
import { Skeleton } from "@/components/ui/skeleton";

interface FloatingBudgetBuddyProps {
  language: Language;
  profileId: string | undefined;
}

export const FloatingBudgetBuddy = ({
  language,
  profileId,
}: FloatingBudgetBuddyProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    insights,
    isLoading,
    error,
    refetch
  } = useFinancialInsights(profileId, language);

  const handleRefresh = () => {
    refetch();
  };

  const getStatusColor = () => {
    if (!insights) return 'default';
    switch (insights.status) {
      case 'healthy': return 'default';
      case 'concern': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = () => {
    if (!insights) return <TrendingUp className="h-6 w-6" />;
    switch (insights.status) {
      case 'healthy': return <CheckCircle className="h-6 w-6" />;
      case 'concern': return <AlertCircle className="h-6 w-6" />;
      case 'critical': return <AlertCircle className="h-6 w-6" />;
      default: return <TrendingUp className="h-6 w-6" />;
    }
  };

  if (!profileId) {
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
        {getStatusIcon()}
        {insights && insights.upcomingPayments.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {insights.upcomingPayments.length}
          </span>
        )}
      </Button>

      {/* Floating Window */}
      {isOpen && (
        <Card className="fixed bottom-40 right-6 w-96 max-w-[calc(100vw-3rem)] shadow-elegant z-50 border-primary/20">
          <CardHeader className="bg-gradient-primary text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Financial Insights' : language === 'es' ? 'Información Financiera' : 'Insights Financeiros'}
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
                ? 'Your financial status and upcoming payments' 
                : language === 'es'
                ? 'Tu estado financiero y próximos pagos'
                : 'Seu status financeiro e pagamentos futuros'}
            </CardDescription>
          </CardHeader>
          
          <ScrollArea className="h-96">
            <CardContent className="pt-6 space-y-4">
              {isLoading && (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Try Again' : language === 'es' ? 'Intentar de nuevo' : 'Tentar novamente'}
                  </Button>
                </div>
              )}

              {!isLoading && !error && insights && (
                <>
                  {/* Status Overview */}
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant={getStatusColor()}>
                          {insights.status === 'healthy' 
                            ? (language === 'en' ? 'Healthy' : language === 'es' ? 'Saludable' : 'Saudável')
                            : insights.status === 'concern'
                            ? (language === 'en' ? 'Attention Needed' : language === 'es' ? 'Atención Requerida' : 'Atenção Necessária')
                            : (language === 'en' ? 'Critical' : language === 'es' ? 'Crítico' : 'Crítico')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insights.statusMessage}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Key Metrics */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {language === 'en' ? 'Key Metrics' : language === 'es' ? 'Métricas Clave' : 'Métricas Principais'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {insights.metrics.map((metric, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {metric.label}
                            {metric.count !== undefined && ` (${metric.count})`}
                          </span>
                          <span className="font-medium">{metric.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Upcoming Payments */}
                  {insights.upcomingPayments.length > 0 && (
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <CardTitle className="text-base">
                            {language === 'en' ? 'Upcoming Payments' : language === 'es' ? 'Próximos Pagos' : 'Pagamentos Futuros'}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {insights.upcomingPayments.map((payment, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                            <div>
                              <p className="font-medium">{payment.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {language === 'en' ? 'Day' : language === 'es' ? 'Día' : 'Dia'} {payment.date}
                              </p>
                            </div>
                            <span className="font-medium">${payment.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Button onClick={handleRefresh} variant="outline" size="sm" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Refresh' : language === 'es' ? 'Actualizar' : 'Atualizar'}
                  </Button>
                </>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      )}
    </>
  );
};
