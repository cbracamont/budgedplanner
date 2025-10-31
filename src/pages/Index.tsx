// src/pages/Index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths } from "date-fns";
import {
  TrendingUp, Settings, AlertCircle, CheckCircle2, Download, LogOut,
  Wallet, PiggyBank, CreditCard, Globe, Zap, DollarSign
} from "lucide-react";
import {
  useIncomeSources,
  useDebts,
  useFixedExpenses,
  useVariableExpenses,
  useSavingsGoals,
  useSavings
} from "@/hooks/useFinancialData";
import { useFinancialProfiles } from "@/hooks/useFinancialProfiles";
import { Auth } from "@/components/Auth";
import { IncomeManager } from "@/components/IncomeManager";
import { DebtsManager } from "@/components/DebtsManager";
import { FixedExpensesManager } from "@/components/FixedExpensesManager";
import { VariableExpensesManager } from "@/components/VariableExpensesManager";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";

type Language = "en" | "es";

// HOOK DENTRO DEL MISMO ARCHIVO (NO necesitas crear nada)
const useVariableIncome = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        setLoading(false);
        return;
      }

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const { data } = await supabase
        .from("variable_income")
        .select("*")
        .eq("user_id", session.session.user.id)
        .gte("date", oneMonthAgo.toISOString())
        .order("date", { ascending: false });

      setData(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const addIncome = async (amount: number, description: string) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { data } = await supabase
      .from("variable_income")
      .insert({
        user_id: session.session.user.id,
        amount,
        description: description || "Ingreso variable",
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (data) setData(prev => [data, ...prev]);
  };

 