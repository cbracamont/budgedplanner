import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  X,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Check,
  CheckCheck,
  Sparkle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Language, formatCurrency } from "@/lib/i18n";
import { useFinancialInsights, UpcomingPayment } from "@/hooks/useFinancialInsights";
import { useNotifications, useUnreadNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { BUDDY_ASK_EVENT } from "@/components/FloatingChatWidget";
import { Skeleton } from "@/components/ui/skeleton";

interface FloatingBudgetBuddyProps {
  language: Language;
  profileId: string | undefined;
  /** Lets an alert take the user straight to the section that can resolve it. */
  onNavigate?: (tab: string) => void;
}

type Lang = "en" | "es" | "pt";
const asLang = (language: Language): Lang => (["en", "es", "pt"].includes(language) ? (language as Lang) : "en");

const copy = {
  en: {
    title: "Alerts & Insights",
    subtitle: "What needs your attention right now",
    alerts: "Alerts",
    insights: "Insights",
    upcoming: "Due in the next 7 days",
    nothingDue: "Nothing due in the next 7 days. Nice work.",
    noAlerts: "No alerts. You are all caught up.",
    healthy: "Healthy",
    concern: "Attention needed",
    critical: "Critical",
    keyMetrics: "Key metrics",
    refresh: "Refresh",
    retry: "Try again",
    markAllRead: "Mark all read",
    markRead: "Mark read",
    today: "Today",
    tomorrow: "Tomorrow",
    inDays: (n: number) => `In ${n} days`,
    goTo: { debt: "Open Debts", fixed: "Open Expenses" },
    askBuddy: "Ask the assistant",
    askPrompt: (names: string, total: string) =>
      `I have ${names} due in the next 7 days, totalling ${total}. Can I cover them and what should I pay first?`,
    total: "Total",
  },
  es: {
    title: "Alertas e Información",
    subtitle: "Lo que necesita tu atención ahora",
    alerts: "Alertas",
    insights: "Información",
    upcoming: "Vence en los próximos 7 días",
    nothingDue: "No hay vencimientos en los próximos 7 días. Bien hecho.",
    noAlerts: "Sin alertas. Estás al día.",
    healthy: "Saludable",
    concern: "Atención requerida",
    critical: "Crítico",
    keyMetrics: "Métricas clave",
    refresh: "Actualizar",
    retry: "Intentar de nuevo",
    markAllRead: "Marcar todo leído",
    markRead: "Marcar leído",
    today: "Hoy",
    tomorrow: "Mañana",
    inDays: (n: number) => `En ${n} días`,
    goTo: { debt: "Ver Deudas", fixed: "Ver Gastos" },
    askBuddy: "Preguntar al asistente",
    askPrompt: (names: string, total: string) =>
      `Tengo ${names} por vencer en los próximos 7 días, un total de ${total}. ¿Puedo cubrirlos y qué debería pagar primero?`,
    total: "Total",
  },
  pt: {
    title: "Alertas e Insights",
    subtitle: "O que precisa da sua atenção agora",
    alerts: "Alertas",
    insights: "Insights",
    upcoming: "Vence nos próximos 7 dias",
    nothingDue: "Nada a vencer nos próximos 7 dias. Bom trabalho.",
    noAlerts: "Sem alertas. Você está em dia.",
    healthy: "Saudável",
    concern: "Atenção necessária",
    critical: "Crítico",
    keyMetrics: "Métricas principais",
    refresh: "Atualizar",
    retry: "Tentar novamente",
    markAllRead: "Marcar tudo como lido",
    markRead: "Marcar lido",
    today: "Hoje",
    tomorrow: "Amanhã",
    inDays: (n: number) => `Em ${n} dias`,
    goTo: { debt: "Abrir Dívidas", fixed: "Abrir Gastos" },
    askBuddy: "Perguntar ao assistente",
    askPrompt: (names: string, total: string) =>
      `Tenho ${names} a vencer nos próximos 7 dias, totalizando ${total}. Consigo pagar e o que devo priorizar?`,
    total: "Total",
  },
} as const;

export const FloatingBudgetBuddy = ({ language, profileId, onNavigate }: FloatingBudgetBuddyProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState("alerts");
  const t = copy[asLang(language)];

  const { insights, isLoading, error, refetch } = useFinancialInsights(profileId, language);
  const { data: notifications } = useNotifications();
  const { data: unread } = useUnreadNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const upcoming = insights?.upcomingPayments ?? [];
  const unreadCount = unread?.length ?? 0;
  const alertCount = unreadCount + upcoming.length;

  const upcomingTotal = useMemo(() => upcoming.reduce((s, p) => s + (p.amount || 0), 0), [upcoming]);

  // Escape closes the panel, matching the chat assistant behaviour.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const dueLabel = (p: UpcomingPayment) => {
    const d = p.daysUntil;
    if (d === undefined) return `${p.date}`;

    if (d === 1) return t.tomorrow;
    return t.inDays(d);
  };

  const statusBadge = () => {
    if (!insights) return null;
    const variant = insights.status === "healthy" ? "default" : insights.status === "concern" ? "secondary" : "destructive";
    const label = insights.status === "healthy" ? t.healthy : insights.status === "concern" ? t.concern : t.critical;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const statusIcon = () => {
    if (!insights) return <Bell className="h-6 w-6" />;
    switch (insights.status) {
      case "healthy":
        return <CheckCircle className="h-6 w-6" />;
      case "concern":
      case "critical":
        return <AlertCircle className="h-6 w-6" />;
      default:
        return <Bell className="h-6 w-6" />;
    }
  };

  const askBuddyAboutUpcoming = () => {
    const names = upcoming.slice(0, 4).map((p) => p.name).join(", ");
    window.dispatchEvent(
      new CustomEvent(BUDDY_ASK_EVENT, {
        detail: { prompt: t.askPrompt(names, formatCurrency(upcomingTotal)) },
      })
    );
    setIsOpen(false);
  };

  const formatMetric = (amount: number | undefined, format?: string, legacy?: string) => {
    if (amount === undefined) return legacy ?? "—";
    return format === "percent" ? `${amount}%` : formatCurrency(amount);
  };

  if (!profileId) return null;

  return (
    <>
      <Button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t.title}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-elegant hover:shadow-glow transition-all z-50 bg-gradient-primary"
        size="icon"
      >
        {statusIcon()}
        {alertCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-40 right-6 w-96 max-w-[calc(100vw-3rem)] shadow-elegant z-50 border-primary/20 animate-in fade-in slide-in-from-bottom-2">
          <CardHeader className="bg-gradient-primary text-primary-foreground pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base leading-tight">{t.title}</CardTitle>
                  <p className="text-xs text-primary-foreground/80">{t.subtitle}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <Tabs value={tab} onValueChange={setTab}>
            <div className="px-4 pt-3">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="alerts" className="gap-1">
                  {t.alerts}
                  {alertCount > 0 && <span className="text-xs">({alertCount})</span>}
                </TabsTrigger>
                <TabsTrigger value="insights">{t.insights}</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-96">
              {/* ALERTS */}
              <TabsContent value="alerts" className="m-0">
                <CardContent className="pt-4 space-y-4">
                  {upcoming.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4" />
                          {t.upcoming}
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(upcomingTotal)}</span>
                      </div>
                      {upcoming.map((p, idx) => (
                        <div key={`${p.name}-${idx}`} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{dueLabel(p)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-sm font-medium">{formatCurrency(p.amount || 0)}</span>
                            {onNavigate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={p.type === "debt" ? t.goTo.debt : t.goTo.fixed}
                                onClick={() => {
                                  onNavigate(p.type === "debt" ? "debts" : "expenses");
                                  setIsOpen(false);
                                }}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full" onClick={askBuddyAboutUpcoming}>
                        <Sparkle className="h-4 w-4 mr-2" />
                        {t.askBuddy}
                      </Button>
                    </div>
                  )}

                  {upcoming.length === 0 && !isLoading && (
                    <p className="text-sm text-muted-foreground">{t.nothingDue}</p>
                  )}

                  {notifications && notifications.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t.alerts}</span>
                        {unreadCount > 0 && (
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => markAllAsRead.mutate()}>
                            <CheckCheck className="h-4 w-4" />
                            {t.markAllRead}
                          </Button>
                        )}
                      </div>
                      {notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className={`rounded-md p-2 border ${n.is_read ? "border-border/50" : "border-primary/30 bg-primary/5"}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{n.title}</p>
                              <p className="text-xs text-muted-foreground">{n.message}</p>
                            </div>
                            {!n.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t.markRead}
                                onClick={() => markAsRead.mutate(n.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {upcoming.length === 0 && (!notifications || notifications.length === 0) && !isLoading && (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{t.noAlerts}</p>
                    </div>
                  )}

                  {isLoading && <Skeleton className="h-24 w-full" />}
                </CardContent>
              </TabsContent>

              {/* INSIGHTS */}
              <TabsContent value="insights" className="m-0">
                <CardContent className="pt-4 space-y-4">
                  {isLoading && (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  )}

                  {error && !isLoading && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">{error}</p>
                      <Button onClick={() => refetch()} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t.retry}
                      </Button>
                    </div>
                  )}

                  {!isLoading && !error && insights && (
                    <>
                      <div className="rounded-md border border-border/50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          {statusBadge()}
                        </div>
                        <p className="text-sm text-muted-foreground">{insights.statusMessage}</p>
                      </div>

                      <div className="rounded-md border border-border/50 p-3 space-y-2">
                        <p className="text-sm font-medium">{t.keyMetrics}</p>
                        {insights.metrics.map((m, idx) => (
                          <div key={m.key ?? idx} className="flex justify-between gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {m.label}
                              {m.count !== undefined && ` (${m.count})`}
                            </span>
                            <span className="font-medium">{formatMetric(m.amount, m.format, m.value)}</span>
                          </div>
                        ))}
                      </div>

                      <Button onClick={() => refetch()} variant="outline" size="sm" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t.refresh}
                      </Button>
                    </>
                  )}
                </CardContent>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </Card>
      )}
    </>
  );
};
