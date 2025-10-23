import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, KeyRound } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128, { message: "Password must be less than 128 characters" })
});

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const { toast } = useToast();

  const disclaimerContent = `**IMPORTANT LEGAL NOTICE - PLEASE READ CAREFULLY**

This application ("Family Budget UK") is provided for informational and educational purposes only. By using this application, you acknowledge and agree to the following:

**1. NOT FINANCIAL ADVICE**
This tool does not provide financial, investment, tax, or legal advice. The information, calculations, recommendations, and AI-generated content provided by this application are for general informational purposes only and should not be construed as professional financial advice.

**2. NO REGULATED FINANCIAL SERVICE**
This application is not regulated by the Financial Conduct Authority (FCA) or any other regulatory body in the United Kingdom or elsewhere. We are not authorized to provide regulated financial advice or services.

**3. USER RESPONSIBILITY**
You are solely responsible for your financial decisions. Before making any financial decisions, you should:
- Consult with a qualified and FCA-regulated financial advisor
- Conduct your own research and due diligence
- Consider your individual circumstances, risk tolerance, and financial goals

**4. NO GUARANTEE OF ACCURACY**
While we strive for accuracy, we make no representations or warranties regarding the accuracy, completeness, or reliability of:
- Calculations and projections
- AI-generated recommendations
- Budget suggestions
- Debt management strategies
- Savings projections

**5. AI LIMITATIONS**
The AI financial feature uses automated algorithms and may:
- Provide incomplete or inaccurate information
- Not consider all relevant factors in your situation
- Generate responses that are not suitable for your circumstances
- Make errors in calculations or recommendations

**6. NO LIABILITY**
To the fullest extent permitted by law, we disclaim all liability for any losses, damages, or adverse consequences arising from:
- Your use of this application
- Reliance on any information or recommendations provided
- Financial decisions made based on this tool
- Any errors, omissions, or technical issues

**7. DATA SECURITY**
While we implement security measures, you use this application at your own risk. We are not liable for any data breaches or unauthorized access to your information.

**8. THIRD-PARTY SERVICES**
This application uses third-party services (including AI models). We are not responsible for the performance, availability, or content provided by third parties.

**9. UK REGULATIONS**
This disclaimer is governed by the laws of England and Wales. If you reside outside the UK, you should ensure compliance with your local financial regulations.

**10. CHANGES TO SERVICE**
We reserve the right to modify, suspend, or discontinue this service at any time without notice.

**SEEK PROFESSIONAL ADVICE**
For personalized financial advice, please consult with an FCA-authorized financial advisor. You can find regulated advisors at: https://register.fca.org.uk/

By signing up or clicking "I Understand and Accept", you confirm that you have read, understood, and agree to this disclaimer.`;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!acceptedDisclaimer) {
        toast({
          title: "Disclaimer Required",
          description: "You must accept the disclaimer to create an account",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const validation = authSchema.safeParse({ email, password });
      
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account created successfully! You can now log in.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.safeParse({ email, password });
      
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailValidation = z.string().trim().email().safeParse(resetEmail);
      
      if (!emailValidation.success) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.data, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "A recovery link has been sent to your email",
        });
        setShowResetPassword(false);
        setResetEmail("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Family Budget UK</CardTitle>
          <CardDescription>Sign in or create an account to manage your budget</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              {showResetPassword ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Enter your email and we'll send you a link to reset your password
                    </AlertDescription>
                  </Alert>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="your@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={loading}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        {loading ? "Sending..." : "Send link"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowResetPassword(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setShowResetPassword(true)}
                  >
                    Forgot your password?
                  </Button>
                </form>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-start space-x-2 py-2">
                  <Checkbox 
                    id="disclaimer" 
                    checked={acceptedDisclaimer}
                    onCheckedChange={(checked) => setAcceptedDisclaimer(checked === true)}
                  />
                  <label
                    htmlFor="disclaimer"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the{" "}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="underline text-primary hover:text-primary/80"
                          onClick={(e) => e.preventDefault()}
                        >
                          disclaimer
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-warning" />
                            Important Legal Disclaimer
                          </DialogTitle>
                          <DialogDescription className="text-left whitespace-pre-line pt-4">
                            {disclaimerContent}
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                    {" "}and understand that this app is for informational purposes only
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !acceptedDisclaimer}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
