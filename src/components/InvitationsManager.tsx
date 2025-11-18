import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  useHouseholdInvitations, 
  useMyInvitations,
  useCreateInvitation, 
  useAcceptInvitation, 
  useRejectInvitation,
  useCancelInvitation 
} from "@/hooks/useHouseholdInvitations";
import { useMyHousehold } from "@/hooks/useHousehold";
import { useIsHouseholdOwner } from "@/hooks/useHouseholdRole";
import { Mail, Loader2, Copy, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const InvitationsManager = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [displayName, setDisplayName] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: myHousehold } = useMyHousehold();
  const isOwner = useIsHouseholdOwner(myHousehold?.household_id);
  const { data: sentInvitations, isLoading: loadingSent } = useHouseholdInvitations(myHousehold?.household_id);
  const { data: receivedInvitations, isLoading: loadingReceived } = useMyInvitations();
  
  const createInvitation = useCreateInvitation();
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();
  const cancelInvitation = useCancelInvitation();

  const handleSendInvitation = () => {
    if (!myHousehold?.household_id || !email) return;
    
    createInvitation.mutate({
      householdId: myHousehold.household_id,
      email,
      role,
    }, {
      onSuccess: () => {
        setEmail("");
        setRole("viewer");
      }
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "editor": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "contributor": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "viewer": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner": return "Propietario";
      case "editor": return "Editor";
      case "contributor": return "Colaborador";
      case "viewer": return "Visualizador";
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Invitaciones recibidas */}
      {receivedInvitations && receivedInvitations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitaciones Recibidas
            </CardTitle>
            <CardDescription>
              Tienes invitaciones pendientes para unirte a hogares
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {receivedInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-card rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Código: {invitation.invitation_code}</p>
                    <Badge className={getRoleBadgeColor(invitation.role)}>
                      {getRoleLabel(invitation.role)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expira: {format(new Date(invitation.expires_at), "PPp", { locale: es })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="space-y-2">
                    <Input
                      placeholder="Tu nombre para mostrar"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-48"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptInvitation.mutate({ 
                          invitationId: invitation.id,
                          displayName 
                        })}
                        disabled={!displayName || acceptInvitation.isPending}
                      >
                        {acceptInvitation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Aceptar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectInvitation.mutate(invitation.id)}
                        disabled={rejectInvitation.isPending}
                      >
                        <X className="h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Enviar invitaciones (solo owner) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Invitar Miembros</CardTitle>
            <CardDescription>
              Envía invitaciones para que otros se unan a tu hogar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Nivel de acceso</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Visualizador - Solo puede ver</SelectItem>
                  <SelectItem value="contributor">Colaborador - Puede agregar sus datos</SelectItem>
                  <SelectItem value="editor">Editor - Puede editar todo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleSendInvitation} 
              disabled={!email || createInvitation.isPending}
              className="w-full"
            >
              {createInvitation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Enviar Invitación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invitaciones enviadas (solo owner) */}
      {isOwner && sentInvitations && sentInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones Enviadas</CardTitle>
            <CardDescription>
              Administra las invitaciones que has enviado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSent ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {sentInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invitation.invited_email}</p>
                        <Badge className={getRoleBadgeColor(invitation.role)}>
                          {getRoleLabel(invitation.role)}
                        </Badge>
                        {invitation.status === "pending" && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                        {invitation.status === "accepted" && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            Aceptada
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          {invitation.invitation_code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyCode(invitation.invitation_code)}
                        >
                          {copiedCode === invitation.invitation_code ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expira: {format(new Date(invitation.expires_at), "PPp", { locale: es })}
                      </p>
                    </div>
                    {invitation.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cancelInvitation.mutate(invitation.id)}
                        disabled={cancelInvitation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
