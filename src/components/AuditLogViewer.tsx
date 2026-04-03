import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useMyHousehold } from "@/hooks/useHousehold";
import { Loader2, FileText, Trash2, Edit, Plus } from "lucide-react";
import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { translations, type Language } from "@/lib/i18n";

interface AuditLogViewerProps {
  language?: Language;
}

const dateLocales = { en: enUS, es: es, pt: ptBR };

export const AuditLogViewer = ({ language = 'en' }: AuditLogViewerProps) => {
  const t = translations[language];
  const { data: myHousehold } = useMyHousehold();
  const { data: logs, isLoading } = useAuditLog(myHousehold?.household_id);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "insert":
      case "create":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "update":
      case "edit":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action.toLowerCase()) {
      case "insert":
      case "create":
        return t.created;
      case "update":
      case "edit":
        return t.edited;
      case "delete":
        return t.deleted;
      default:
        return action;
    }
  };

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      debts: t.debt,
      income_sources: t.incomeSource,
      fixed_expenses: t.fixedExpense,
      variable_expenses: t.variableExpense,
      savings_goals: t.savingsGoal,
      debt_payments: t.debtPayment,
    };
    return labels[tableName] || tableName;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.changeHistory}</CardTitle>
        <CardDescription>{t.changeHistoryDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {!logs || logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.noChangesYet}
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {log.user_display_name || t.user}
                        </p>
                        <Badge variant="outline">
                          {getActionLabel(log.action)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {getTableLabel(log.table_name)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "PPp", { locale: dateLocales[language] })}
                      </p>
                    </div>
                    
                    {log.new_values && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">{t.changes}:</p>
                        <div className="bg-background p-2 rounded border">
                          {Object.entries(log.new_values).map(([key, value]) => {
                            const oldValue = log.old_values?.[key];
                            if (oldValue === value) return null;
                            
                            return (
                              <div key={key} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">{key}:</span>
                                {oldValue !== undefined && (
                                  <>
                                    <span className="line-through text-red-500">{String(oldValue)}</span>
                                    <span>→</span>
                                  </>
                                )}
                                <span className="text-green-500">{String(value)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
