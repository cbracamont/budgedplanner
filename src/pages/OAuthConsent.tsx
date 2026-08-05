import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

type AuthorizationDetails = {
  client?: { name?: string; client_uri?: string };
  redirect_url?: string;
  redirect_to?: string;
};

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        if (active) setNeedsAuth(true);
        return;
      }
      if (active) setNeedsAuth(false);
      const { data, error: detailsError } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) load();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error: decideError } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (decideError) {
      setBusy(false);
      setError(decideError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Could not load this request</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (needsAuth) {
    return (
      <main className="min-h-screen">
        <div className="max-w-xl mx-auto pt-8 px-4 text-center">
          <h1 className="text-xl font-semibold mb-1">Sign in to continue</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to your Budget Planner account to approve this connection request.
          </p>
        </div>
        <Auth />
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const clientName = details.client?.name ?? "an app";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-medium">Authorize access</span>
          </div>
          <CardTitle>Connect {clientName} to your account</CardTitle>
          <CardDescription>
            This lets {clientName} read your budget, debts and savings goals, and add expenses on your behalf. You can
            revoke access at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
          </Button>
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
            Deny
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
