import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Copy, Check, LogOut, UserCheck, UserX } from "lucide-react";
import { useMyHousehold, useHouseholdMembers, useCreateHousehold, useJoinHousehold, useLeaveHousehold } from "@/hooks/useHousehold";
import { useApproveHouseholdMember, useRejectHouseholdMember } from "@/hooks/useHouseholdApprovals";
import { useIsHouseholdOwner } from "@/hooks/useHouseholdRole";
import { getTranslation, Language } from "@/lib/i18n";
import { householdSchema } from "@/components/validation/schemas";
import { toast } from "sonner";

interface HouseholdManagerProps {
  language: Language;
}

export const HouseholdManager = ({ language }: HouseholdManagerProps) => {
  const [displayName, setDisplayName] = useState("");
  const [householdIdInput, setHouseholdIdInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"create" | "join" | null>(null);

  const myHousehold = useMyHousehold();
  const members = useHouseholdMembers(myHousehold.data?.household_id);
  const isOwner = useIsHouseholdOwner(myHousehold.data?.household_id);
  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();
  const leaveHousehold = useLeaveHousehold();
  const approveMember = useApproveHouseholdMember();
  const rejectMember = useRejectHouseholdMember();

  const handleCreate = () => {
    const result = householdSchema.safeParse({ displayName });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    createHousehold.mutate(displayName);
    setDisplayName("");
    setMode(null);
  };

  const handleJoin = () => {
    const result = householdSchema.safeParse({ displayName, householdId: householdIdInput });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    joinHousehold.mutate({ 
      householdId: householdIdInput,
      displayName 
    });
    setDisplayName("");
    setHouseholdIdInput("");
    setMode(null);
  };

  const handleCopyId = () => {
    if (myHousehold.data?.household_id) {
      navigator.clipboard.writeText(myHousehold.data.household_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (myHousehold.isLoading) {
    return <div>Loading...</div>;
  }

  if (myHousehold.data) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>{getTranslation(language, 'household')}</CardTitle>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => leaveHousehold.mutate(myHousehold.data.id)}
              disabled={leaveHousehold.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {getTranslation(language, 'leaveHousehold')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{getTranslation(language, 'householdId')}:</span>
              <code className="px-2 py-1 bg-muted rounded text-xs">{myHousehold.data.household_id}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyId}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div>
              <h3 className="font-medium mb-2">{getTranslation(language, 'members')}:</h3>
              <div className="space-y-2">
                {members.data?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <div className="font-medium">{member.display_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.status !== 'approved' && `(${member.status})`}
                      </div>
                    </div>
                    {isOwner && member.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => approveMember.mutate(member.id)}
                          disabled={approveMember.isPending}
                        >
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => rejectMember.mutate(member.id)}
                          disabled={rejectMember.isPending}
                        >
                          <UserX className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>{getTranslation(language, 'household')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!mode && (
          <div className="space-y-2">
            <Button onClick={() => setMode("create")} className="w-full">
              {getTranslation(language, 'createHousehold')}
            </Button>
            <Button onClick={() => setMode("join")} variant="outline" className="w-full">
              {getTranslation(language, 'joinHousehold')}
            </Button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">{getTranslation(language, 'displayName')}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreate} 
                disabled={createHousehold.isPending}
              >
                {getTranslation(language, 'create')}
              </Button>
              <Button onClick={() => setMode(null)} variant="outline">
                {getTranslation(language, 'cancel')}
              </Button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="householdId">{getTranslation(language, 'householdId')}</Label>
              <Input
                id="householdId"
                value={householdIdInput}
                onChange={(e) => setHouseholdIdInput(e.target.value)}
                placeholder="Enter household ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joinDisplayName">{getTranslation(language, 'displayName')}</Label>
              <Input
                id="joinDisplayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleJoin} 
                disabled={joinHousehold.isPending}
              >
                {getTranslation(language, 'join')}
              </Button>
              <Button onClick={() => setMode(null)} variant="outline">
                {getTranslation(language, 'cancel')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
