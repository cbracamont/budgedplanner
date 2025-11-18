import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useMyHousehold } from "@/hooks/useHousehold";
import { Loader2, FileText, Trash2, Edit, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AuditLogViewer = () => {
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
        return "Creó";
      case "update":
      case "edit":
        return "Editó";
      case "delete":
        return "Eliminó";
      default:
        return action;
    }
  };

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      debts: "deuda",
      income_sources: "ingreso",
      fixed_expenses: "gasto fijo",
      variable_expenses: "gasto variable",
      savings_goals: "meta de ahorro",
      debt_payments: "pago de deuda",
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
        <CardTitle>Historial de Cambios</CardTitle>
        <CardDescription>
          Registro de todas las modificaciones realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {!logs || logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay cambios registrados aún
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
                          {log.user_display_name || "Usuario"}
                        </p>
                        <Badge variant="outline">
                          {getActionLabel(log.action)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {getTableLabel(log.table_name)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "PPp", { locale: es })}
                      </p>
                    </div>
                    
                    {log.new_values && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Cambios:</p>
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
