// src/components/Auth.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Mail, Lock, User, Chrome, Phone } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

// NUEVO: Tipo ampliado para LanguageToggle
type Language = "en" | "es" | "pl";
type AuthMethod = "email" | "phone";

export const Auth = () => {
  useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { email, phone, password, confirmPassword, name } = formData;

    if (authMethod === "email" && (!email || !password)) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    if (authMethod === "phone" && !phone) {
      setError("Phone number is required");
      setLoading(false);
      return;
    }

    if (!isLogin) {
      if (authMethod === "email" && password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      if (authMethod === "email" && password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }
      if (!acceptedTerms) {
        setError("You must accept the Terms of Use");
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        if (authMethod === "email") {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signInWithOtp({
            phone,
          });
          if (error) throw error;
          setSuccess("Check your phone! We've sent you a verification code.");
        }
      } else {
        if (authMethod === "email") {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
              emailRedirectTo: `${window.location.origin}/`,
            },
          });
          if (error) throw error;
          setSuccess("Check your email! We've sent you a confirmation link.");
        } else {
          const { error } = await supabase.auth.signUp({
            phone,
            password,
            options: {
              data: { name },
            },
          });
          if (error) throw error;
          setSuccess("Check your phone! We've sent you a verification code.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      setSuccess("Password reset link sent to your email. Please check your inbox.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Sign in to manage your family budget" : "Start planning your finances today"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as AuthMethod)} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="h-4 w-4 mr-2" />
                Phone
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {authMethod === "email" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={isLogin ? "Enter password" : "Create a strong password"}
                      className="pl-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repeat your password"
                        className="pl-10"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+44 7700 900000"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLogin 
                    ? "We'll send you a verification code via SMS" 
                    : "Include country code (e.g., +44 for UK)"}
                </p>
              </div>
            )}

            {!isLogin && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm font-medium">
                  I accept the{" "}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                    Terms of Use
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading || (!isLogin && !acceptedTerms)}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="mt-4 w-full" onClick={signInWithGoogle} disabled={loading}>
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </div>

          {isLogin && authMethod === "email" && (
            <div className="mt-4 text-center">
              <button
                onClick={handlePasswordReset}
                className="text-sm text-blue-600 hover:underline"
                disabled={loading}
              >
                Forgot your password?
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-blue-600 hover:underline">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            By using this app, you agree to our{" "}
            <a href="/terms" target="_blank" className="underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" className="underline">
              Privacy Policy
            </a>
            .
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
