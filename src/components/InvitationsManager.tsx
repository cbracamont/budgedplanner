import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  useHouseholdInvitations, 
  useMyInvitations,
  useCreateInvitation, 
  useAcceptInvitation, 
  useRejectInvitation,
  useCancelInvitation,
  useJoinByCode
} from "@/hooks/useHouseholdInvitations";
import { useMyHousehold } from "@/hooks/useHousehold";
import { useIsHouseholdOwner } from "@/hooks/useHouseholdRole";
import { Mail, Loader2, Copy, Check, X, Clock, UserPlus, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const InvitationsManager = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: myHousehold } = useMyHousehold();
  const isOwner = useIsHouseholdOwner(myHousehold?.household_id);
  const { data: sentInvitations, isLoading: loadingSent } = useHouseholdInvitations(myHousehold?.household_id);
  const { data: receivedInvitations, isLoading: loadingReceived } = useMyInvitations();
  
  const createInvitation = useCreateInvitation();
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();
  const cancelInvitation = useCancelInvitation();
  const joinByCode = useJoinByCode();

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

  const handleJoinByCode = () => {
    if (!joinCode.trim()) {
      toast.error("Please enter an invitation code");
      return;
    }
    
    joinByCode.mutate(joinCode.trim(), {
      onSuccess: () => {
        setJoinCode("");
      }
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copied to clipboard");
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
      case "owner": return "Owner";
      case "editor": return "Editor";
      case "contributor": return "Contributor";
      case "viewer": return "Viewer";
      default: return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          <Check className="h-3 w-3 mr-1" />
          Accepted
        </Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
          <X className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Join by Code Section - Always visible when NOT in a household */}
      {!myHousehold && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Join a Household
            </CardTitle>
            <CardDescription>
              Enter an invitation code to join an existing household
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">Invitation Code</Label>
              <div className="flex gap-2">
                <Input
                  id="join-code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter invitation code"
                  className="flex-1"
                />
                <Button 
                  onClick={handleJoinByCode}
                  disabled={joinByCode.isPending || !joinCode.trim()}
                >
                  {joinByCode.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Join"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Household Code - Show when user IS in a household */}
      {myHousehold && sentInvitations && sentInvitations.length > 0 && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Your Household Invitations
            </CardTitle>
            <CardDescription>
              Share these codes with family members to invite them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sentInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-card rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1 bg-muted rounded font-mono text-sm font-bold">
                      {invitation.invitation_code}
                    </code>
                    <Badge className={getRoleBadgeColor(invitation.role)}>
                      {getRoleLabel(invitation.role)}
                    </Badge>
                    {getStatusBadge(invitation.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For: {invitation.invited_email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires: {format(new Date(invitation.expires_at), "PPp")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyCode(invitation.invitation_code)}
                  >
                    {copiedCode === invitation.invitation_code ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {invitation.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInvitation.mutate(invitation.id)}
                      disabled={cancelInvitation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Received Invitations */}
      {receivedInvitations && receivedInvitations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Received Invitations
            </CardTitle>
            <CardDescription>
              You have pending invitations to join households
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {receivedInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-card rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Code: {invitation.invitation_code}</p>
                    <Badge className={getRoleBadgeColor(invitation.role)}>
                      {getRoleLabel(invitation.role)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expires: {format(new Date(invitation.expires_at), "PPp")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptInvitation.mutate(invitation.id)}
                    disabled={acceptInvitation.isPending}
                  >
                    {acceptInvitation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectInvitation.mutate(invitation.id)}
                    disabled={rejectInvitation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Invitation - Only for owners */}
      {isOwner && myHousehold && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send New Invitation
              </CardTitle>
              <CardDescription>
                Invite family members to join your household
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        Viewer - Can only view data
                      </div>
                    </SelectItem>
                    <SelectItem value="contributor">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Contributor - Can add their own data
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Editor - Can edit all data
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSendInvitation}
                disabled={createInvitation.isPending || !email}
                className="w-full"
              >
                {createInvitation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!myHousehold && (!receivedInvitations || receivedInvitations.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Invitations</h3>
            <p className="text-sm text-muted-foreground">
              Enter a code above to join a household or wait for an invitation
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

