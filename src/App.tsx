


// src/App.tsx
"use client";

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { DebtPlannerPro } from "./components/DebtPlannerPro";
import { SavingsEngine } from "./components/SavingsEngine";
import { OnboardingFlow } from "./components/OnboardingFlow";

// Dentro del return principal:
<OnboardingFlow />
<div className="p-8">
  <h1 className="text-4xl font-bold mb-8">Family Budget Planner UK 2025</h1>
  <DebtPlannerPro />
  <SavingsEngine />
</div>
const queryClient = new QueryClient();

export default function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <FloatingChatWidget />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
