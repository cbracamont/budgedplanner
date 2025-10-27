import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, LogOut, Copy, Check } from "lucide-react";
import { useMyHousehold, useHouseholdMembers, useCreateHousehold, useJoinHousehold, useLeaveHousehold } from "@/hooks/useHousehold";
import { Language, getTranslation } from "@/lib/i18n";
import { toast } from "sonner";

interface HouseholdManagerProps {
  language: Language;
}

export const HouseholdManager = ({ language }: HouseholdManagerProps) => {
  const [displayName, setDisplayName] = useState("");
  const [householdIdInput, setHouseholdIdInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"create" | "join" | null>(null);

  const { data: myHousehold } = useMyHousehold();
  const { data: members = [] } = useHouseholdMembers(myHousehold?.household_id);
  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();
  const leaveHousehold = useLeaveHousehold();

  const handleCreate = async () => {
    if (!displayName.trim()) {
      toast.error(language === "es" ? "Ingresa tu nombre" : "Enter your name");
      return;
    }

    await createHousehold.mutateAsync({ displayName });
    setDisplayName("");
    setMode(null);
  };

  const handleJoin = async () => {
    if (!displayName.trim() || !householdIdInput.trim()) {
      toast.error(language === "es" ? "Completa todos los campos" : "Fill all fields");
      return;
    }

    await joinHousehold.mutateAsync({ householdId: householdIdInput, displayName });
    setDisplayName("");
    setHouseholdIdInput("");
    setMode(null);
  };

  const handleCopyId = () => {
    if (myHousehold?.household_id) {
      navigator.clipboard.writeText(myHousehold.household_id);
      setCopied(true);
      toast.success(language === "es" ? "ID copiado al portapapeles" : "ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (myHousehold) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {language === "es" ? "Mi Hogar" : "My Household"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Gestiona las finanzas de tu familia en conjunto" 
              : "Manage your family finances together"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{language === "es" ? "ID del Hogar" : "Household ID"}</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                value={myHousehold.household_id} 
                readOnly 
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyId}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" 
                ? "Comparte este ID con tu familia para que puedan unirse" 
                : "Share this ID with your family to join"}
            </p>
          </div>

          <div>
            <Label className="mb-2 block">
              {language === "es" ? "Miembros del Hogar" : "Household Members"}
            </Label>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{member.display_name || language === "es" ? "Sin nombre" : "No name"}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role === "owner" 
                        ? (language === "es" ? "Propietario" : "Owner")
                        : (language === "es" ? "Miembro" : "Member")}
                    </p>
                  </div>
                  <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                    {member.role === "owner" ? "👑" : "👤"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => myHousehold.id && leaveHousehold.mutate(myHousehold.id)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {language === "es" ? "Salir del Hogar" : "Leave Household"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {language === "es" ? "Modo Familiar" : "Family Mode"}
        </CardTitle>
        <CardDescription>
          {language === "es" 
            ? "Gestiona las finanzas de tu hogar en conjunto" 
            : "Manage your household finances together"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!mode && (
          <div className="grid gap-3">
            <Button onClick={() => setMode("create")} className="w-full">
              <Users className="h-4 w-4 mr-2" />
              {language === "es" ? "Crear Hogar" : "Create Household"}
            </Button>
            <Button variant="outline" onClick={() => setMode("join")} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              {language === "es" ? "Unirse a Hogar" : "Join Household"}
            </Button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="displayName">
                {language === "es" ? "Tu Nombre" : "Your Name"}
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={language === "es" ? "Ej: María" : "E.g: Maria"}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="flex-1">
                {language === "es" ? "Crear" : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setMode(null)}>
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="householdId">
                {language === "es" ? "ID del Hogar" : "Household ID"}
              </Label>
              <Input
                id="householdId"
                value={householdIdInput}
                onChange={(e) => setHouseholdIdInput(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label htmlFor="joinDisplayName">
                {language === "es" ? "Tu Nombre" : "Your Name"}
              </Label>
              <Input
                id="joinDisplayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={language === "es" ? "Ej: Juan" : "E.g: John"}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleJoin} className="flex-1">
                {language === "es" ? "Unirse" : "Join"}
              </Button>
              <Button variant="outline" onClick={() => setMode(null)}>
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};