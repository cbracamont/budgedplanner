import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2, CreditCard, Calendar, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Language } from '@/lib/i18n';

interface SubscriptionStatus {
  subscribed: boolean;
  product_id?: string;
  subscription_end?: string;
  trial?: boolean;
}

interface SubscriptionManagerProps {
  language: Language;
}

export const SubscriptionManager = ({ language }: SubscriptionManagerProps) => {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      setCheckingStatus(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: language === 'en' ? 'Error' : 'Error',
        description: language === 'en' 
          ? 'Failed to start subscription process' 
          : 'Error al iniciar el proceso de suscripción',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: language === 'en' ? 'Error' : 'Error',
        description: language === 'en' 
          ? 'Failed to open subscription management' 
          : 'Error al abrir la gestión de suscripción',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={subscriptionStatus?.subscribed ? "border-primary shadow-lg" : "border-primary/20"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">
              {language === 'en' ? 'Premium Subscription' : 'Suscripción Premium'}
            </CardTitle>
          </div>
          {subscriptionStatus?.subscribed && (
            <Badge variant={subscriptionStatus.trial ? "secondary" : "default"} className="gap-1">
              {subscriptionStatus.trial ? (
                <>
                  <Calendar className="h-3 w-3" />
                  {language === 'en' ? 'Trial Period' : 'Período de Prueba'}
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  {language === 'en' ? 'Active' : 'Activa'}
                </>
              )}
            </Badge>
          )}
        </div>
        <CardDescription>
          {subscriptionStatus?.subscribed ? (
            subscriptionStatus.trial ? (
              language === 'en' 
                ? '30-day free trial - Full access to all premium features'
                : '30 días de prueba gratuita - Acceso completo a todas las funciones premium'
            ) : (
              language === 'en'
                ? 'You have full access to all premium features'
                : 'Tienes acceso completo a todas las funciones premium'
            )
          ) : (
            language === 'en'
              ? 'Unlock unlimited AI financial advice and advanced features'
              : 'Desbloquea asesoramiento financiero con IA ilimitado y funciones avanzadas'
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!subscriptionStatus?.subscribed ? (
          <>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">
                    {language === 'en' ? '30 Days Free Trial' : '30 Días de Prueba Gratuita'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'Try all premium features risk-free' 
                      : 'Prueba todas las funciones premium sin riesgo'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">
                    {language === 'en' ? 'Unlimited AI Advisor' : 'Asesor IA Ilimitado'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'Get personalized financial advice anytime' 
                      : 'Recibe asesoramiento financiero personalizado cuando quieras'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">
                    {language === 'en' ? 'Advanced Analytics' : 'Análisis Avanzados'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'Detailed reports and insights' 
                      : 'Reportes detallados e información avanzada'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">£9.99</span>
                <span className="text-muted-foreground">/{language === 'en' ? 'month' : 'mes'}</span>
              </div>
              
              <Button 
                onClick={handleSubscribe} 
                disabled={loading}
                className="w-full gap-2"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {language === 'en' ? 'Start Free Trial' : 'Comenzar Prueba Gratuita'}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                {language === 'en' 
                  ? 'Credit card required. Cancel anytime during trial.' 
                  : 'Tarjeta de crédito requerida. Cancela cuando quieras durante la prueba.'}
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {subscriptionStatus.subscription_end && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {subscriptionStatus.trial 
                    ? (language === 'en' ? 'Trial ends on:' : 'La prueba termina el:')
                    : (language === 'en' ? 'Next billing date:' : 'Próxima fecha de facturación:')}
                </p>
                <p className="font-medium">
                  {new Date(subscriptionStatus.subscription_end).toLocaleDateString(
                    language === 'en' ? 'en-GB' : 'es-ES',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleManageSubscription} 
              disabled={loading}
              variant="outline"
              className="w-full gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {language === 'en' ? 'Manage Subscription' : 'Gestionar Suscripción'}
            </Button>
            
            <Button 
              onClick={checkSubscription} 
              variant="ghost"
              size="sm"
              className="w-full"
            >
              {language === 'en' ? 'Refresh Status' : 'Actualizar Estado'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
